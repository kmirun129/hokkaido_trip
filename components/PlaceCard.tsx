"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { TripItem, PlaceType, SubTask } from "@/types";
import { useMode } from "@/lib/mode";
import { useSettings } from "@/lib/settings";
import { parseHours, formatHoursText, getWeekday } from "@/lib/hours";
import PhotoGallery from "./PhotoGallery";

const TYPE_CONFIG: Record<PlaceType, {
  emoji: string; bg: string; color: string; border: string;
}> = {
  観光:   { emoji: '📷', bg: '#E8F4FF', color: '#0A6FB8', border: '#3B82F6' },
  食事:   { emoji: '🍴', bg: '#FFF1E6', color: '#D2691E', border: '#F97316' },
  宿泊:   { emoji: '🛏', bg: '#F0EAFE', color: '#6B4DD4', border: '#8B5CF6' },
  体験:   { emoji: '✨', bg: '#E8F8EE', color: '#1F9D55', border: '#10B981' },
  その他: { emoji: '📍', bg: '#F1F3F5', color: '#5C6770', border: '#94A3B8' },
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // ローカル状態でサブタスクのチェックを管理（非永続）
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const hoursData = parseHours(item.business_hours);
  const weekday = settings.start_date ? getWeekday(settings.start_date, item.day) : undefined;
  const hoursText = hoursData ? formatHoursText(hoursData, weekday) : item.business_hours;
  const isClosed = hoursData && weekday && hoursData.closed.includes(weekday);

  const subTasks = (item.sub_items ?? []).filter((t: SubTask) => t.content.trim());
  const hasSubInfo = item.description || item.business_hours || item.memo || subTasks.length > 0;
  const hasMap = !!(item.name && item.maps_url);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div
      id={`place-${item.id}`}
      className="bg-white rounded-2xl overflow-hidden scroll-mt-20 transition-all duration-150 hover:-translate-y-px active:scale-[0.99]"
      style={{
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${cfg.border}`,
      }}
    >
      <div className="px-4 pt-4 pb-3 space-y-3">
        {/* ── 上段: カテゴリピル + 3点メニュー ── */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <span>{cfg.emoji}</span>
            {type}
            {item.duration && (
              <span className="opacity-60 font-normal ml-1">⏱ {item.duration}</span>
            )}
          </span>

          {isEdit && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors text-xl leading-none"
              >⋯</button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-36 bg-white rounded-xl overflow-hidden z-30"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
                  <button onClick={() => { onMoveUp(); setMenuOpen(false); }} disabled={isFirst}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-2">
                    ▲ 上に移動
                  </button>
                  <button onClick={() => { onMoveDown(); setMenuOpen(false); }} disabled={isLast}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-2">
                    ▼ 下に移動
                  </button>
                  <div className="h-px bg-slate-100" />
                  <button onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    ✏️ 編集
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                    🗑️ 削除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 時刻（上） + 場所名（下、大きく） ── */}
        <div>
          {item.time && (
            <div className="text-[13px] font-medium text-slate-400 tracking-wide mb-1">
              🕐 {item.time}
            </div>
          )}
          <h3 className="text-[20px] font-bold text-slate-900 leading-tight">
            {item.name ?? '（名称未設定）'}
          </h3>
        </div>

        {/* ── 写真（角丸コンテナ内） ── */}
        <PhotoGallery tripItemId={item.id} editable={isEdit} />

        {/* ── 詳細情報 ── */}
        {(hasSubInfo || hasMap) && (
          <div className="space-y-2.5 pt-0.5">
            {item.description && (
              <p className="text-[14px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                {item.description}
              </p>
            )}
            {hoursText && (
              <div className={`flex items-start gap-2 text-[13px] ${isClosed ? 'text-red-500' : 'text-slate-500'}`}>
                <span className="flex-shrink-0">🕐</span>
                <span className="leading-relaxed">{hoursText}</span>
              </div>
            )}
            {item.memo && (
              <div className="flex items-start gap-2 text-[13px] text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
                <span className="flex-shrink-0">📝</span>
                <span className="leading-relaxed whitespace-pre-wrap">{item.memo}</span>
              </div>
            )}

            {/* サブタスク（チェック可能リスト、ローカル状態のみ） */}
            {subTasks.length > 0 && (
              <div className="space-y-1">
                {subTasks.map((task: SubTask) => {
                  const done = checked.has(task.id);
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggleCheck(task.id)}
                      className="w-full flex items-center gap-2.5 py-1.5 text-left group"
                    >
                      {/* チェックボックス */}
                      <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                        done ? 'bg-slate-400 border-slate-400' : 'border-slate-300 group-hover:border-slate-400'
                      }`}>
                        {done && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className={`flex items-center gap-1.5 text-[14px] flex-1 ${
                        done ? 'line-through text-slate-400' : 'text-slate-700'
                      }`}>
                        {task.showTime && task.time && (
                          <span className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                            done ? 'text-slate-400 bg-slate-100' : 'text-sky-600 bg-sky-50'
                          }`}>{task.time}</span>
                        )}
                        {task.content}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Googleマップ アクションチップ */}
            {hasMap && (
              <a
                href={item.maps_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                Googleマップで開く
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
