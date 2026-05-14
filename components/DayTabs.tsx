const DAY_LABELS = ['1日目', '2日目', '3日目', '4日目'];

type Props = {
  activeDay: number;
  onDayChange: (day: number) => void;
};

export default function DayTabs({ activeDay, onDayChange }: Props) {
  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="flex max-w-2xl mx-auto">
        {DAY_LABELS.map((label, i) => {
          const day = i + 1;
          const active = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => onDayChange(day)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${
                active
                  ? 'text-sky'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {label}
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
