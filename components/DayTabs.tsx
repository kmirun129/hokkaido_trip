"use client";

import { useSettings } from "@/lib/settings";
import { useMode } from "@/lib/mode";
import { getDayLabel } from "@/lib/hours";

type Props = {
  activeDay: number;
  onDayChange: (day: number) => void;
};

export default function DayTabs({ activeDay, onDayChange }: Props) {
  const { settings } = useSettings();
  const { mode, toggle } = useMode();
  const isEdit = mode === "edit";

  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="flex items-center max-w-2xl mx-auto">
        <div className="flex flex-1 min-w-0">
          {[1, 2, 3, 4].map((day) => {
            const active = activeDay === day;
            const dateLabel = settings.start_date
              ? getDayLabel(settings.start_date, day)
              : null;
            return (
              <button
                key={day}
                onClick={() => onDayChange(day)}
                className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-sm font-semibold transition-all relative ${
                  active ? 'text-sky' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{day}日目</span>
                {dateLabel && (
                  <span className={`text-[10px] font-medium ${active ? 'text-sky/70' : 'text-slate-300'}`}>
                    {dateLabel}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-sky rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={toggle}
          className={`flex-shrink-0 mx-3 h-7 px-3 rounded-full text-[11px] font-medium transition-all ${
            isEdit
              ? "bg-accent text-white shadow-sm hover:bg-accent/90"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {isEdit ? "編集中" : "プレビュー"}
        </button>
      </div>
    </div>
  );
}
