"use client";

import { TripItem, PlaceType, SubTask } from "@/types";
import { useMode } from "@/lib/mode";
import { useSettings } from "@/lib/settings";
import { parseHours, formatHoursText, getWeekday } from "@/lib/hours";
import PhotoGallery from "./PhotoGallery";

const TYPE_CONFIG: Record<PlaceType, { color: string; bg: string }> = {
  観光:   { color: 'text-sky',      bg: 'bg-sky-light' },
  食事:   { color: 'text-accent',   bg: 'bg-accent-light' },
  宿泊:   { color: 'text-lavender', bg: 'bg-lavender-light' },
  体験:   { color: 'text-nature',   bg: 'bg-nature-light' },
  その他: { color: 'text-slate-500',bg: 'bg-slate-100' },
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
  const { settings } = useSettings();
  const isEdit = mode === "edit";
  const type = (item.place_type ?? 'その他') as PlaceType;
  const cfg = TYPE_CONFIG[type];

  // 営業時間：構造化JSON or 平文テキスト
  const hoursData = parseHours(item.business_hours);
  const weekday = settings.start_date ? getWeekday(settings.start_date, item.day) : undefined;
  const hoursText = hoursData
    ? formatHoursText(hoursData, weekday)
    : item.business_hours;

  const isClosed = hoursData && weekday && hoursData.closed.includes(weekday);

  const subTasks = (item.sub_items ?? []).filter((t: SubTask) => t.content.trim());
  const hasSubInfo = item.description || item.business_hours || item.memo || subTasks.length > 0;
  const hasMap = !!(item.name && item.maps_url);

  return (
    <div
      id={`place-${item.id}`}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden scroll-mt-20"
    >
      {/* ── 上部: メタ + 時刻 + 名前 + マップ右端固定 ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* メタ行（カテゴリ・所要時間） */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {type}
              </span>
              {item.duration && (
                <span className="text-[11px] text-slate-400">⏱ {item.duration}</span>
              )}
            </div>
            {/* 時刻 + 場所名（大きく目立たせる） */}
            <div className="flex items-baseline gap-2.5 flex-wrap">
              {item.time && (
                <span className="text-xl font-bold tabular-nums text-sky leading-none">
                  {item.time}
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-800 leading-tight break-words">
                {item.name ?? '（名称未設定）'}
              </h3>
            </div>
          </div>

          {/* 右端固定: プレビュー時はMapボタン / 編集時は編集ボタン群 */}
          {isEdit ? (
            <div className="flex flex-col gap-1 flex-shrink-0">
              <div className="flex gap-1">
                <button onClick={onMoveUp} disabled={isFirst}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition-colors">▲</button>
                <button onClick={onMoveDown} disabled={isLast}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition-colors">▼</button>
              </div>
              <div className="flex gap-1">
                <button onClick={onEdit}
                  className="w-7 h-7 rounded-lg bg-sky-light hover:bg-sky/20 flex items-center justify-center text-xs transition-colors">✏️</button>
                <button onClick={onDelete}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-xs transition-colors">🗑️</button>
              </div>
            </div>
          ) : hasMap ? (
            <a
              href={item.maps_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-sky bg-sky-light px-2.5 py-1.5 rounded-full hover:bg-sky hover:text-white transition-colors"
            >
              📍 Map
            </a>
          ) : null}
        </div>
      </div>

      {/* ── 中央: 写真ギャラリー（左右12px内側、上下12px余白、角丸コンテナ） ── */}
      <div className="px-3 mt-3">
        <PhotoGallery tripItemId={item.id} editable={isEdit} />
      </div>

      {/* ── 下部: 詳細情報 ── */}
      {hasSubInfo && (
        <div className="px-4 pb-3 pt-3 mt-1 space-y-2 border-t border-slate-50">
          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          )}
          {hoursText && (
            <div className={`flex items-start gap-2 text-sm ${isClosed ? 'text-red-500' : 'text-slate-500'}`}>
              <span className="text-base flex-shrink-0">🕐</span>
              <span className="leading-relaxed">{hoursText}</span>
            </div>
          )}
          {item.memo && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
              <span className="text-base flex-shrink-0">📝</span>
              <span className="leading-relaxed whitespace-pre-wrap">{item.memo}</span>
            </div>
          )}
          {subTasks.length > 0 && (
            <div className="bg-slate-50 rounded-xl px-3 py-2.5 space-y-1.5">
              {subTasks.map((task: SubTask) => (
                <div key={task.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-slate-300 flex-shrink-0">•</span>
                  {task.showTime && task.time && (
                    <span className="text-[11px] font-semibold tabular-nums text-sky bg-sky/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                      {task.time}
                    </span>
                  )}
                  <span className="leading-snug">{task.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 編集モードのみ: 下部にマップリンク（編集ボタンと干渉するため） */}
      {isEdit && hasMap && (
        <div className="px-4 pb-4">
          <a href={item.maps_url!} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-sky font-semibold hover:underline">
            <span>📍</span> Googleマップで開く
          </a>
        </div>
      )}
    </div>
  );
}
