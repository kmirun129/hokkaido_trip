"use client";

import { TripItem, TransportMode } from "@/types";
import { useMode } from "@/lib/mode";

const MODE_ICON: Record<TransportMode, string> = {
  徒歩: '🚶', 車: '🚗', 電車: '🚃', バス: '🚌',
  飛行機: '✈️', タクシー: '🚕', フェリー: '⛴️',
};

type Props = { item: TripItem; onEdit: () => void; onDelete: () => void };

export default function TransportBar({ item, onEdit, onDelete }: Props) {
  const { mode } = useMode();
  const isEdit = mode === "edit";
  const transportMode = (item.transport_mode ?? '車') as TransportMode;

  return (
    <div className="flex items-stretch px-5 py-0">
      {/* タイムライン縦線 + アイコン */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 32 }}>
        <div className="w-px flex-1 bg-slate-200" />
        <div
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[15px] flex-shrink-0 my-1"
          style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          {MODE_ICON[transportMode]}
        </div>
        <div className="w-px flex-1 bg-slate-200" />
      </div>

      {/* テキスト情報 */}
      <div className="flex items-center gap-2 pl-3 py-3 flex-1 min-w-0">
        <span className="text-[12px] font-medium text-slate-500">{transportMode}</span>
        {item.transport_duration && (
          <span className="text-[12px] text-slate-400">· {item.transport_duration}</span>
        )}
        {item.transport_memo && (
          <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full truncate">
            {item.transport_memo}
          </span>
        )}
      </div>

      {/* 編集ボタン */}
      {isEdit && (
        <div className="flex items-center gap-1 flex-shrink-0 py-3">
          <button onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs transition-colors">✏️</button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-xs transition-colors">🗑️</button>
        </div>
      )}
    </div>
  );
}
