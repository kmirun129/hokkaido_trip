"use client";

import { Car, Footprints, Train, Bus, Plane, Ship, CarTaxiFront, Pencil, Trash2 } from "lucide-react";
import { TripItem, TransportMode } from "@/types";
import { useMode } from "@/lib/mode";

const MODE_ICON: Record<TransportMode, React.ElementType> = {
  徒歩:   Footprints,
  車:     Car,
  電車:   Train,
  バス:   Bus,
  飛行機: Plane,
  タクシー: CarTaxiFront,
  フェリー: Ship,
};

// ドット列コンポーネント
function Dots() {
  return (
    <div className="flex flex-col items-center gap-[5px] py-1">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="w-[3px] h-[3px] rounded-full bg-slate-300" />
      ))}
    </div>
  );
}

type Props = { item: TripItem; onEdit: () => void; onDelete: () => void };

export default function TransportBar({ item, onEdit, onDelete }: Props) {
  const { mode } = useMode();
  const isEdit = mode === "edit";
  const transportMode = (item.transport_mode ?? '車') as TransportMode;
  const Icon = MODE_ICON[transportMode];

  return (
    <div className="flex flex-col items-center py-2">
      <Dots />

      {/* 中央チップ */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-100"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <Icon size={15} className="text-slate-400 flex-shrink-0" />
          <span className="text-[12px] font-medium text-slate-600">{transportMode}</span>
          {item.transport_duration && (
            <>
              <span className="text-slate-200 select-none">·</span>
              <span className="text-[12px] text-slate-400">{item.transport_duration}</span>
            </>
          )}
          {/* 編集ボタン：チップ内の右端に */}
          {isEdit && (
            <div className="flex gap-1 ml-1 pl-2 border-l border-slate-100">
              <button
                onClick={onEdit}
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              ><Pencil size={12} /></button>
              <button
                onClick={onDelete}
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              ><Trash2 size={12} /></button>
            </div>
          )}
        </div>

        {/* メモ：チップ下に別行 */}
        {item.transport_memo && (
          <span className="text-[11px] text-slate-400 text-center">
            {item.transport_memo}
          </span>
        )}
      </div>

      <Dots />
    </div>
  );
}
