import { TripItem, PlaceType } from "@/types";

const TYPE_CONFIG: Record<PlaceType, { icon: string; color: string; bg: string }> = {
  観光: { icon: '🏔️', color: 'text-sky',     bg: 'bg-sky-light' },
  食事: { icon: '🍜', color: 'text-accent',  bg: 'bg-accent-light' },
  宿泊: { icon: '🏨', color: 'text-lavender', bg: 'bg-lavender-light' },
  体験: { icon: '🎿', color: 'text-nature',  bg: 'bg-nature-light' },
  その他: { icon: '📍', color: 'text-slate-500', bg: 'bg-slate-100' },
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
  const type = (item.place_type ?? 'その他') as PlaceType;
  const cfg = TYPE_CONFIG[type];

  return (
    <div id={`place-${item.id}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* カードヘッダー */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${cfg.bg}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              {type}
            </span>
            {item.time && (
              <span className="text-xs text-slate-400 font-medium">🕐 {item.time}</span>
            )}
            {item.duration && (
              <span className="text-xs text-slate-400">⏱ {item.duration}</span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-base mt-0.5 truncate">
            {item.name ?? '（名称未設定）'}
          </h3>
        </div>
        {/* 操作ボタン */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div className="flex gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition-colors"
            >▲</button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition-colors"
            >▼</button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="w-6 h-6 rounded-lg bg-sky-light hover:bg-sky/20 flex items-center justify-center text-xs transition-colors"
            >✏️</button>
            <button
              onClick={onDelete}
              className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-xs transition-colors"
            >🗑️</button>
          </div>
        </div>
      </div>

      {/* サブ情報（空欄は自動非表示） */}
      {(item.description || item.business_hours || item.memo || item.maps_url) && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-50 pt-3">
          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
          )}
          {item.business_hours && (
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <span className="text-base">🕐</span>
              <span>{item.business_hours}</span>
            </div>
          )}
          {item.memo && (
            <div className="flex items-start gap-2 text-sm text-slate-500 bg-amber-50 rounded-xl px-3 py-2">
              <span className="text-base">📝</span>
              <span>{item.memo}</span>
            </div>
          )}
          {item.maps_url && (
            <a
              href={item.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-sky font-medium hover:underline"
            >
              <span>📍</span> Googleマップで開く
            </a>
          )}
        </div>
      )}
    </div>
  );
}
