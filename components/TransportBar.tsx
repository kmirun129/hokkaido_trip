"use client";

import { TripItem, TransportMode } from "@/types";
import { useMode } from "@/lib/mode";

const MODE_ICON: Record<TransportMode, string> = {
  徒歩: '🚶', 車: '🚗', 電車: '🚃', バス: '🚌',
  飛行機: '✈️', タクシー: '🚕', フェリー: '⛴️',
};

type Props = {
  item: TripItem;
  onEdit: () => void;
  onDelete: () => void;
};

export default function TransportBar({ item, onEdit, onDelete }: Props) {
  const { mode } = useMode();
  const isEdit = mode === "edit";
  const transportMode = (item.transport_mode ?? '車') as TransportMode;
  const icon = MODE_ICON[transportMode];

  return (
    <div className="flex items-center gap-3 px-4 py-1.5">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-px h-3 bg-slate-300" />
        <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-base shadow-sm">
          {icon}
        </div>
        <div className="w-px h-3 bg-slate-300" />
      </div>

      <div className="flex-1 flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <span className="font-medium text-slate-600">{transportMode}</span>
        {item.transport_duration && (
          <span className="text-slate-400">· {item.transport_duration}</span>
        )}
        {item.transport_memo && (
          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
            {item.transport_memo}
          </span>
        )}
      </div>

      {isEdit && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs transition-colors"
          >✏️</button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-xs transition-colors"
          >🗑️</button>
        </div>
      )}
    </div>
  );
}
