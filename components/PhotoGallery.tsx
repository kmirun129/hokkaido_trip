"use client";

import { useState, useEffect, useRef } from "react";
import { getClient } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import { PlacePhoto } from "@/types";

const BUCKET = "place-photos";

function publicUrl(path: string) {
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

type Props = { tripItemId: number };

export default function PhotoGallery({ tripItemId }: Props) {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripItemId]);

  const fetchPhotos = async () => {
    const { data } = await getClient()
      .from("place_photos")
      .select("*")
      .eq("trip_item_id", tripItemId)
      .order("order_index", { ascending: true });
    setPhotos((data as PlacePhoto[]) ?? []);
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const base = photos.length > 0 ? Math.max(...photos.map((p) => p.order_index)) : 0;
    for (let i = 0; i < files.length; i++) {
      try {
        const blob = await compressImage(files[i]);
        const path = `${tripItemId}/${Date.now()}-${i}.jpg`;
        const { error } = await getClient()
          .storage.from(BUCKET)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (error) continue;
        await getClient().from("place_photos").insert({
          trip_item_id: tripItemId,
          storage_path: path,
          order_index: base + (i + 1) * 10,
        });
      } catch {
        // skip failed uploads silently
      }
    }
    await fetchPhotos();
    setUploading(false);
  };

  const handleDelete = async (photo: PlacePhoto) => {
    await getClient().storage.from(BUCKET).remove([photo.storage_path]);
    await getClient().from("place_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const swap = async (i: number, j: number) => {
    const a = photos[i], b = photos[j];
    if (!a || !b) return;
    await Promise.all([
      getClient().from("place_photos").update({ order_index: b.order_index }).eq("id", a.id),
      getClient().from("place_photos").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    await fetchPhotos();
  };

  return (
    <div className="px-4 pb-4 pt-2 border-t border-slate-50">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl(photo.storage_path)}
                alt=""
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(publicUrl(photo.storage_path))}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center px-1.5 py-1">
                <button
                  onClick={() => swap(idx, idx - 1)}
                  disabled={idx === 0}
                  className="text-white disabled:opacity-25 text-xs leading-none px-1 py-0.5 rounded hover:bg-white/20"
                >◀</button>
                <button
                  onClick={() => handleDelete(photo)}
                  className="text-red-300 hover:text-white text-xs leading-none px-1 py-0.5 rounded hover:bg-red-500/60"
                >✕</button>
                <button
                  onClick={() => swap(idx, idx + 1)}
                  disabled={idx === photos.length - 1}
                  className="text-white disabled:opacity-25 text-xs leading-none px-1 py-0.5 rounded hover:bg-white/20"
                >▶</button>
              </div>
            </div>
          ))}
          {uploading && (
            <div className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center">
              <span className="text-xs text-slate-400 animate-pulse">追加中...</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-sky hover:text-sky transition-colors disabled:opacity-50"
      >
        {uploading ? "アップロード中..." : "📷 写真を追加"}
      </button>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          <button
            className="absolute top-5 right-5 text-white text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
            onClick={() => setLightbox(null)}
          >✕</button>
        </div>
      )}
    </div>
  );
}
