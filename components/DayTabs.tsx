"use client";

import { useSettings } from "@/lib/settings";
import { getDayLabel } from "@/lib/hours";

type Props = {
  activeDay: number;
  onDayChange: (day: number) => void;
};

export default function DayTabs({ activeDay, onDayChange }: Props) {
  const { settings } = useSettings();

  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="flex max-w-2xl mx-auto">
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
    </div>
  );
}
