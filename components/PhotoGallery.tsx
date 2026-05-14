"use client";

import { useState, useEffect, useRef } from "react";
import { getClient } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import { PlacePhoto } from "@/types";

const BUCKET = "place-photos";

function publicUrl(path: string) {
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

type Props = { tripItemId: number; editable: boolean };

export default function PhotoGallery({ tripItemId, editable }: Props) {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
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
        // skip failed
      }
    }
    await fetchPhotos();
    setUploading(false);
  };

  const handleDelete = async (photo: PlacePhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    await getClient().storage.from(BUCKET).remove([photo.storage_path]);
    await getClient().from("place_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const swap = async (i: number, j: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = photos[i], b = photos[j];
    if (!a || !b) return;
    await Promise.all([
      getClient().from("place_photos").update({ order_index: b.order_index }).eq("id", a.id),
      getClient().from("place_photos").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    await fetchPhotos();
  };

  // Hide entirely if no photos and not editable
  if (photos.length === 0 && !editable) return null;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />

      {photos.length > 0 && (
        <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="snap-center flex-shrink-0 w-full aspect-[16/10] relative bg-slate-100 cursor-pointer"
              onClick={() => setLightbox(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl(photo.storage_path)}
                alt=""
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-sm">
                  {idx + 1} / {photos.length}
                </div>
              )}
              {editable && (
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center gap-2">
                  <button
                    onClick={(e) => swap(idx, idx - 1, e)}
                    disabled={idx === 0}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs disabled:opacity-30 hover:bg-black/70"
                  >◀</button>
                  <button
                    onClick={(e) => handleDelete(photo, e)}
                    className="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-sm text-white text-xs hover:bg-red-500"
                  >🗑</button>
                  <button
                    onClick={(e) => swap(idx, idx + 1, e)}
                    disabled={idx === photos.length - 1}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs disabled:opacity-30 hover:bg-black/70"
                  >▶</button>
                </div>
              )}
            </div>
          ))}
          {uploading && (
            <div className="snap-center flex-shrink-0 w-full aspect-[16/10] bg-slate-100 flex items-center justify-center">
              <span className="text-xs text-slate-400 animate-pulse">追加中...</span>
            </div>
          )}
        </div>
      )}

      {editable && (
        <div className="px-4 py-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs hover:border-sky hover:text-sky transition-colors disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "📷 写真を追加"}
          </button>
        </div>
      )}

      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicUrl(photos[lightbox].storage_path)}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + photos.length) % photos.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white text-xl"
              >◀</button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % photos.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white text-xl"
              >▶</button>
            </>
          )}
          <button
            className="absolute top-5 right-5 text-white text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
            onClick={() => setLightbox(null)}
          >✕</button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
