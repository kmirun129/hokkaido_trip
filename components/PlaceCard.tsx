"use client";

import { TripItem, PlaceType, SubTask } from "@/types";
import { useMode } from "@/lib/mode";
import { useSettings } from "@/lib/settings";
import { parseHours, formatHoursText, getWeekday } from "@/lib/hours";
import { MapPin, Pencil, Trash2, ChevronUp, ChevronDown, Clock } from "lucide-react";
import PhotoGallery from "./PhotoGallery";

const TYPE_CONFIG: Record<PlaceType, { color: string; bg: string; gradient: string }> = {
  観光:   { color: 'text-sky',       bg: 'bg-sky-light',      gradient: 'linear-gradient(135deg, #5BA3D9 0%, #1E5F99 100%)' },
  食事:   { color: 'text-accent',    bg: 'bg-accent-light',   gradient: 'linear-gradient(135deg, #FF6B35 0%, #C03A0E 100%)' },
  宿泊:   { color: 'text-lavender',  bg: 'bg-lavender-light', gradient: 'linear-gradient(135deg, #9B7EC8 0%, #5E3A9E 100%)' },
  体験:   { color: 'text-nature',    bg: 'bg-nature-light',   gradient: 'linear-gradient(135deg, #5BA85F 0%, #2B6E2F 100%)' },
  その他: { color: 'text-slate-500', bg: 'bg-slate-100',      gradient: 'linear-gradient(135deg, #64748B 0%, #334155 100%)' },
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

  const hoursData = parseHours(item.business_hours);
  const weekday = settings.start_date ? getWeekday(settings.start_date, item.day) : undefined;
  const hoursText = hoursData ? formatHoursText(hoursData, weekday) : item.business_hours;
  const isClosed = hoursData && weekday && hoursData.closed.includes(weekday);

  const subTasks = (item.sub_items ?? []).filter((t: SubTask) => t.content.trim());
  const hasSubInfo = item.description || item.business_hours || item.memo || subTasks.length > 0;
  const hasMap = !!(item.name && item.maps_url);

  return (
    <div
      id={`place-${item.id}`}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden scroll-mt-20"
    >
      {/* ── ヘッダー: [チップ + Map] 1行目 → [タイトル全幅] 2行目 ── */}
      <div className="px-4 pt-4 pb-3">
        {/* Row 1: チップ（時刻+カテゴリ） + 右端ボタン */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0 ${cfg.bg}`}>
              {item.time && (
                <span className={`text-[14px] font-bold tabular-nums leading-none ${cfg.color}`}>
                  {item.time}
                </span>
              )}
              <span className="text-[10px] text-slate-400 leading-none select-none">·</span>
              <span className={`text-[11px] font-semibold leading-none ${cfg.color}`}>{type}</span>
            </div>
            {item.duration && (
              <span className="text-[11px] text-slate-400 flex-shrink-0">{item.duration}</span>
            )}
          </div>

          {/* 右端: Mapリンク or 編集ボタン群 */}
          {isEdit ? (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={onMoveUp} disabled={isFirst}
                className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center transition-colors">
                <ChevronUp size={15} />
              </button>
              <button onClick={onMoveDown} disabled={isLast}
                className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center transition-colors">
                <ChevronDown size={15} />
              </button>
              <button onClick={onEdit}
                className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors ml-0.5">
                <Pencil size={13} />
              </button>
              <button onClick={onDelete}
                className="w-7 h-7 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ) : hasMap ? (
            <a
              href={item.maps_url!}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-shrink-0 inline-flex items-center gap-1 text-[12px] font-medium ${cfg.color} hover:opacity-70 transition-opacity`}
            >
              <MapPin size={13} />
              <span>Map</span>
            </a>
          ) : null}
        </div>

        {/* Row 2: 場所名（全幅・明朝体） */}
        <h3 className="font-mincho text-[22px] font-extrabold tracking-tight leading-tight break-words text-[#222222]">
          {item.name ?? '（名称未設定）'}
        </h3>
      </div>

      {/* ── 写真 ── */}
      <div className="px-3 mt-3">
        <PhotoGallery tripItemId={item.id} editable={isEdit} />
      </div>

      {/* ── 詳細 ── */}
      {hasSubInfo && (
        <div className="px-4 pb-4 pt-3 mt-1 space-y-3 border-t border-slate-50">
          {item.description && (
            <p className="text-[13.5px] text-slate-600 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          )}

          {hoursText && (
            <div className={`flex items-start gap-2 text-[13px] ${isClosed ? 'text-red-500' : 'text-slate-500'}`}>
              <Clock size={13} className="flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{hoursText}</span>
            </div>
          )}

          {item.memo && (
            <div className="border-l-2 border-slate-200 pl-3">
              <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {item.memo}
              </p>
            </div>
          )}

          {subTasks.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              {subTasks.map((task: SubTask) => (
                <div key={task.id} className="flex items-baseline gap-2.5 text-[13px]">
                  {task.showTime && task.time ? (
                    <span className={`tabular-nums font-semibold flex-shrink-0 w-12 ${cfg.color}`}>
                      {task.time}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 w-12" />
                  )}
                  <span className="text-slate-700 leading-snug">{task.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 編集モード時の Map リンク */}
      {isEdit && hasMap && (
        <div className="px-4 pb-4">
          <a href={item.maps_url!} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-xs ${cfg.color} font-medium hover:opacity-70 transition-opacity`}>
            <MapPin size={12} />
            <span>Googleマップで開く</span>
          </a>
        </div>
      )}
    </div>
  );
}
