"use client";

import { TripItem, PlaceType } from "@/types";
import { useMode } from "@/lib/mode";
import PhotoGallery from "./PhotoGallery";

const TYPE_CONFIG: Record<PlaceType, { icon: string; color: string; bg: string; ring: string }> = {
  観光:   { icon: '🏔️', color: 'text-sky',      bg: 'bg-sky-light',      ring: 'ring-sky/20' },
  食事:   { icon: '🍜', color: 'text-accent',   bg: 'bg-accent-light',   ring: 'ring-accent/20' },
  宿泊:   { icon: '🏨', color: 'text-lavender', bg: 'bg-lavender-light', ring: 'ring-lavender/20' },
  体験:   { icon: '🎿', color: 'text-nature',   bg: 'bg-nature-light',   ring: 'ring-nature/20' },
  その他: { icon: '📍', color: 'text-slate-500',bg: 'bg-slate-100',      ring: 'ring-slate-300/20' },
};

type Props = {
  item: TripItem;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export default function PlaceCard({
  item, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: Props) {
  const { mode } = useMode();
  const isEdit = mode === "edit";
  const type = (item.place_type ?? 'その他') as PlaceType;
  const cfg = TYPE_CONFIG[type];

  const hasSubInfo = item.description || item.business_hours || item.memo;

  return (
    <div
      id={`place-${item.id}`}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden scroll-mt-20"
    >
      {/* 写真ギャラリー（最上部） */}
      <PhotoGallery tripItemId={item.id} editable={isEdit} />

      {/* カードヘッダー */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${cfg.bg} ring-4 ${cfg.ring} flex-shrink-0`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              {type}
            </span>
            {item.time && (
              <span className="text-xs text-slate-500 font-semibold tabular-nums">🕐 {item.time}</span>
            )}
            {item.duration && (
              <span className="text-xs text-slate-400">⏱ {item.duration}</span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-base leading-snug">
            {item.name ?? '（名称未設定）'}
          </h3>
        </div>

        {isEdit && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <div className="flex gap-1">
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition-colors"
              >▲</button>
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition-colors"
              >▼</button>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="w-7 h-7 rounded-lg bg-sky-light hover:bg-sky/20 flex items-center justify-center text-xs transition-colors"
              >✏️</button>
              <button
                onClick={onDelete}
                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-xs transition-colors"
              >🗑️</button>
            </div>
          </div>
        )}
      </div>

      {/* サブ情報（説明・営業時間・メモ） */}
      {hasSubInfo && (
        <div className="px-4 pb-3 space-y-2 border-t border-slate-50 pt-3">
          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          )}
          {item.business_hours && (
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <span className="text-base flex-shrink-0">🕐</span>
              <span className="leading-relaxed">{item.business_hours}</span>
            </div>
          )}
          {item.memo && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
              <span className="text-base flex-shrink-0">📝</span>
              <span className="leading-relaxed whitespace-pre-wrap">{item.memo}</span>
            </div>
          )}
        </div>
      )}

      {/* マップリンク */}
      {item.name && (item.maps_url || isEdit) && (
        <div className="px-4 pb-4">
          {item.maps_url ? (
            <a
              href={item.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-sky font-semibold hover:underline"
            >
              <span>📍</span> Googleマップで開く
            </a>
          ) : (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky transition-colors"
            >
              <span>🔍</span> Googleマップで探す
            </a>
          )}
        </div>
      )}
    </div>
  );
}
