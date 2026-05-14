"use client";

import { useState, useEffect, useRef } from "react";
import { getClient } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import { PlacePhoto } from "@/types";

const BUCKET = "place-photos";
const MAX_VISIBLE = 6;

function publicUrl(path: string) {
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

type Layout = { container: string; cells: string[] };

// 枚数別のグリッド構成。空白セルが出ないように調整。
function getLayout(count: number): Layout {
  switch (count) {
    case 1:
      return { container: 'aspect-[16/10]', cells: [''] };
    case 2:
      return {
        container: 'grid grid-cols-2 gap-0.5 aspect-[2/1]',
        cells: ['', ''],
      };
    case 3:
      // 左に大きな1枚 + 右に縦2枚
      return {
        container: 'grid grid-cols-3 grid-rows-2 gap-0.5 aspect-[3/2]',
        cells: ['col-span-2 row-span-2', '', ''],
      };
    case 4:
      return {
        container: 'grid grid-cols-2 grid-rows-2 gap-0.5 aspect-square',
        cells: ['', '', '', ''],
      };
    case 5:
      // 上行2枚（各50%幅）+ 下行3枚（各33%幅）
      return {
        container: 'grid grid-cols-6 grid-rows-2 gap-0.5 aspect-[6/5]',
        cells: ['col-span-3', 'col-span-3', 'col-span-2', 'col-span-2', 'col-span-2'],
      };
    default: // 6 cells (6枚以上)
      return {
        container: 'grid grid-cols-3 grid-rows-2 gap-0.5 aspect-[3/2]',
        cells: ['', '', '', '', '', ''],
      };
  }
}

type Props = { tripItemId: number; editable: boolean; onCountChange?: (count: number) => void };

export default function PhotoGallery({ tripItemId, editable, onCountChange }: Props) {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripItemId]);

  useEffect(() => {
    onCountChange?.(photos.length);
  }, [photos.length, onCountChange]);

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
    const stamp = Date.now();
    // 並列アップロード（複数枚を一度に高速処理）
    await Promise.all(
      Array.from(files).map(async (file, i) => {
        try {
          const blob = await compressImage(file);
          const path = `${tripItemId}/${stamp}-${i}.jpg`;
          const { error } = await getClient()
            .storage.from(BUCKET)
            .upload(path, blob, { contentType: "image/jpeg" });
          if (error) return;
          await getClient().from("place_photos").insert({
            trip_item_id: tripItemId,
            storage_path: path,
            order_index: base + (i + 1) * 10,
          });
        } catch {
          // skip failed
        }
      })
    );
    await fetchPhotos();
    setUploading(false);
  };

  const handleDelete = async (photo: PlacePhoto) => {
    await getClient().storage.from(BUCKET).remove([photo.storage_path]);
    await getClient().from("place_photos").delete().eq("id", photo.id);
    const newPhotos = photos.filter((p) => p.id !== photo.id);
    setPhotos(newPhotos);
    if (lightbox !== null) {
      if (newPhotos.length === 0) setLightbox(null);
      else if (lightbox >= newPhotos.length) setLightbox(newPhotos.length - 1);
    }
  };

  const swap = async (i: number, j: number) => {
    const a = photos[i], b = photos[j];
    if (!a || !b) return;
    await Promise.all([
      getClient().from("place_photos").update({ order_index: b.order_index }).eq("id", a.id),
      getClient().from("place_photos").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    await fetchPhotos();
    if (lightbox === i) setLightbox(j);
    else if (lightbox === j) setLightbox(i);
  };

  if (photos.length === 0 && !editable) return null;

  const displayCount = Math.min(photos.length, MAX_VISIBLE);
  const visiblePhotos = photos.slice(0, displayCount);
  const hiddenCount = photos.length - displayCount;
  const layout = getLayout(displayCount);

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

      {visiblePhotos.length > 0 && (
        <div className={`relative ${layout.container}`}>
          {visiblePhotos.map((photo, idx) => {
            const isLast = idx === displayCount - 1;
            const showOverlay = isLast && hiddenCount > 0;
            return (
              <div
                key={photo.id}
                className={`relative bg-slate-100 cursor-pointer overflow-hidden ${layout.cells[idx]}`}
                onClick={() => setLightbox(idx)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicUrl(photo.storage_path)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {showOverlay && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                    <span className="text-2xl sm:text-3xl font-bold leading-none">+{hiddenCount}</span>
                    <span className="text-[10px] sm:text-xs mt-1 opacity-90">タップで全{photos.length}枚</span>
                  </div>
                )}
                {editable && !showOverlay && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white text-sm flex items-center justify-center transition-colors"
                    title="削除"
                  >×</button>
                )}
              </div>
            );
          })}
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-center text-[10px] py-1">追加中...</div>
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
            onClick={(e) => e.stopPropagation()}
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
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
          >✕</button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs">
            {lightbox + 1} / {photos.length}
          </div>
          {editable && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); swap(lightbox, lightbox - 1); }}
                disabled={lightbox === 0}
                className="px-3 h-9 rounded-full bg-white/15 hover:bg-white/30 disabled:opacity-30 text-white text-xs"
              >← 順序</button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(photos[lightbox]); }}
                className="w-9 h-9 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-sm flex items-center justify-center"
                title="削除"
              >🗑</button>
              <button
                onClick={(e) => { e.stopPropagation(); swap(lightbox, lightbox + 1); }}
                disabled={lightbox === photos.length - 1}
                className="px-3 h-9 rounded-full bg-white/15 hover:bg-white/30 disabled:opacity-30 text-white text-xs"
              >順序 →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
