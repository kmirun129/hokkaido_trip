"use client";

import { useState, useEffect } from "react";
import { TripItem, PlaceType, TransportMode, NewTripItem } from "@/types";

const PLACE_TYPES: PlaceType[] = ['観光', '食事', '宿泊', '体験', 'その他'];
const TRANSPORT_MODES: TransportMode[] = ['徒歩', '車', '電車', 'バス', '飛行機', 'タクシー', 'フェリー'];

type ModalMode =
  | { type: 'add-place'; day: number; orderIndex: number }
  | { type: 'add-transport'; day: number; orderIndex: number }
  | { type: 'edit'; item: TripItem };

type Props = {
  mode: ModalMode;
  onSave: (data: NewTripItem) => Promise<void>;
  onClose: () => void;
};

export default function ItemModal({ mode, onSave, onClose }: Props) {
  const isTransport =
    mode.type === 'add-transport' ||
    (mode.type === 'edit' && mode.item.item_type === 'transport');

  const initial: NewTripItem = mode.type === 'edit'
    ? { ...mode.item }
    : isTransport
    ? {
        day: (mode as { day: number }).day,
        order_index: (mode as { orderIndex: number }).orderIndex,
        item_type: 'transport',
        transport_mode: '車',
        transport_duration: null,
        transport_memo: null,
        place_type: null, name: null, time: null, duration: null,
        description: null, memo: null, business_hours: null, maps_url: null,
      }
    : {
        day: (mode as { day: number }).day,
        order_index: (mode as { orderIndex: number }).orderIndex,
        item_type: 'place',
        place_type: '観光',
        name: null, time: null, duration: null,
        description: null, memo: null, business_hours: null, maps_url: null,
        transport_mode: null, transport_duration: null, transport_memo: null,
      };

  const [form, setForm] = useState<NewTripItem>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (key: keyof NewTripItem, value: string | null) => {
    setForm((f) => ({ ...f, [key]: value || null }));
  };

  const handleSave = async () => {
    if (!isTransport && !form.name?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const Field = ({
    label, field, placeholder, multiline,
  }: {
    label: string;
    field: keyof NewTripItem;
    placeholder?: string;
    multiline?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={(form[field] as string) ?? ''}
          onChange={(e) => set(field, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40 resize-none"
        />
      ) : (
        <input
          type="text"
          value={(form[field] as string) ?? ''}
          onChange={(e) => set(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">
            {mode.type === 'edit'
              ? isTransport ? '移動を編集' : '場所を編集'
              : isTransport ? '移動を追加' : '場所を追加'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {isTransport ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">移動手段</label>
                <div className="flex flex-wrap gap-2">
                  {TRANSPORT_MODES.map((m) => (
                    <button
                      key={m}
                      onClick={() => set('transport_mode', m)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        form.transport_mode === m
                          ? 'bg-sky text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="所要時間" field="transport_duration" placeholder="例: 約30分" />
              <Field label="メモ（駐車場情報など）" field="transport_memo" placeholder="例: 道の駅で休憩" multiline />
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">種別</label>
                <div className="flex flex-wrap gap-2">
                  {PLACE_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => set('place_type', t)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        form.place_type === t
                          ? 'bg-sky text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="場所名 *" field="name" placeholder="例: 美瑛の丘" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="時刻" field="time" placeholder="例: 10:00" />
                <Field label="所要時間" field="duration" placeholder="例: 約1時間" />
              </div>
              <Field label="説明文" field="description" placeholder="場所の説明や見どころ" multiline />
              <Field label="営業時間" field="business_hours" placeholder="例: 9:00〜17:00" />
              <Field label="メモ" field="memo" placeholder="個人的なメモ" multiline />
              <Field label="GoogleマップURL" field="maps_url" placeholder="https://maps.google.com/..." />
            </>
          )}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!isTransport && !form.name?.trim())}
            className="flex-1 py-3 rounded-xl bg-sky hover:bg-sky/90 disabled:bg-sky/40 text-white font-semibold text-sm transition-colors"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
