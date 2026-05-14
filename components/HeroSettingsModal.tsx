"use client";

import { useEffect, useRef, useState } from "react";
import { getClient } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import { TripSettings } from "@/types";

const BUCKET = "place-photos";

function publicUrl(path: string) {
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

type Props = {
  settings: TripSettings;
  onClose: () => void;
  onSaved: (s: TripSettings) => void;
};

export default function HeroSettingsModal({ settings, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(settings.title);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [duration, setDuration] = useState(settings.duration_label);
  const [tagsText, setTagsText] = useState(settings.tags.join(", "));
  const [heroPath, setHeroPath] = useState<string | null>(settings.hero_image_path);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const blob = await compressImage(file, 1800, 0.85);
      const path = `_hero/${Date.now()}.jpg`;
      const { error } = await getClient()
        .storage.from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg" });
      if (!error) {
        if (heroPath) {
          await getClient().storage.from(BUCKET).remove([heroPath]).catch(() => {});
        }
        setHeroPath(path);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeHero = async () => {
    if (heroPath) {
      await getClient().storage.from(BUCKET).remove([heroPath]).catch(() => {});
    }
    setHeroPath(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = tagsText
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const { data } = await getClient()
      .from("trip_settings")
      .update({
        title: title.trim() || "旅行",
        subtitle: subtitle.trim(),
        duration_label: duration.trim(),
        tags,
        hero_image_path: heroPath,
      })
      .eq("id", 1)
      .select()
      .single();
    setSaving(false);
    if (data) onSaved(data as TripSettings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">ヘッダーを編集</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
              placeholder="例: 北海道旅行"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">サブタイトル（日付など）</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
              placeholder="例: 2026年 夏の旅"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">期間ラベル</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
              placeholder="例: 4日間"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
              placeholder="例: 絶景, グルメ, 体験"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">背景画像</label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
            {heroPath ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicUrl(heroPath)} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-semibold text-slate-700 hover:bg-white"
                  >
                    {uploading ? "..." : "差し替え"}
                  </button>
                  <button
                    onClick={removeHero}
                    className="px-3 py-1.5 rounded-lg bg-red-500/90 text-xs font-semibold text-white hover:bg-red-500"
                  >
                    削除
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-sky hover:text-sky transition-colors disabled:opacity-50"
              >
                {uploading ? "アップロード中..." : "🖼️ 画像を選択"}
              </button>
            )}
            <p className="text-[10px] text-slate-400 mt-1">画像なしの場合はグラデーション背景になります</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-3 rounded-xl bg-sky hover:bg-sky/90 disabled:bg-sky/40 text-white font-semibold text-sm"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
