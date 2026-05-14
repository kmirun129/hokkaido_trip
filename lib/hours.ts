export type HoursBlock = { start: string; end: string };
export type BusinessHours = {
  v: 1;
  blocks: HoursBlock[];   // 0〜2ブロック
  closed: string[];        // 定休曜日: '月'〜'日'
};

export function parseHours(raw: string | null | undefined): BusinessHours | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d.v === 1) return d as BusinessHours;
  } catch {}
  return null;
}

export function formatHoursText(hours: BusinessHours, weekday?: string): string {
  if (weekday && hours.closed.includes(weekday)) return '定休日';
  if (hours.blocks.length === 0) return '';
  return hours.blocks.map((b) => `${b.start}〜${b.end}`).join(' / ');
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function getWeekday(startDate: string, dayNum: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayNum - 1);
  return WEEKDAY_NAMES[d.getDay()];
}

export function getDayLabel(startDate: string, dayNum: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayNum - 1);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY_NAMES[d.getDay()]})`;
}

// 30分刻みの時刻オプション (0:00〜24:00)
export const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    opts.push(`${h}:00`, `${h}:30`);
  }
  opts.push('24:00');
  return opts;
})();

// 5分刻みの所要時間オプション (5分〜6時間)
export const DURATION_OPTIONS: string[] = (() => {
  const opts: string[] = [''];
  for (let min = 5; min <= 360; min += 5) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) opts.push(`${m}分`);
    else if (m === 0) opts.push(`${h}時間`);
    else opts.push(`${h}時間${m}分`);
  }
  opts.push('半日', '1日');
  return opts;
})();
