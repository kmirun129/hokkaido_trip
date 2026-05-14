"use client";

import { useState, useEffect } from "react";
import { TripItem, PlaceType, TransportMode, NewTripItem } from "@/types";

const PLACE_TYPES: PlaceType[] = ['観光', '食事', '宿泊', '体験', 'その他'];
const TRANSPORT_MODES: TransportMode[] = ['徒歩', '車', '電車', 'バス', '飛行機', 'タクシー', 'フェリー'];

const DURATION_CHIPS = ['15分', '30分', '45分', '1時間', '1時間30分', '2時間', '半日', '1日'];
const TRANSPORT_DURATION_CHIPS = ['約5分', '約10分', '約15分', '約20分', '約30分', '約1時間', '約1時間30分', '約2時間'];
const HOURS_CHIPS = ['9:00〜17:00', '10:00〜21:00', '11:00〜22:00', '11:30〜14:30, 17:00〜22:00', '24時間営業', '定休日: 月曜'];

type ModalMode =
  | { type: 'add-place'; day: number; orderIndex: number }
  | { type: 'add-transport'; day: number; orderIndex: number }
  | { type: 'edit'; item: TripItem };

type Props = {
  mode: ModalMode;
  onSave: (data: NewTripItem) => Promise<void>;
  onClose: () => void;
};

function Field({
  label, value, onChange, placeholder, multiline, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
        />
      )}
    </div>
  );
}

function ChipPicker({
  label, value, onChange, chips, placeholder, multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  chips: string[];
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
        />
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {chips.map((c) => {
          const active = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(active ? '' : c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-sky text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

  type FetchResult =
    | { type: 'found'; label: string; url: string }
    | { type: 'multiple'; candidates: { label: string; url: string }[] }
    | { type: 'none' }
    | { type: 'too_many' }
    | { type: 'error' };

  const [form, setForm] = useState<NewTripItem>(initial);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (key: keyof NewTripItem, value: string) => {
    setForm((f) => ({ ...f, [key]: value || null }));
    if (key === 'name') setFetchResult(null);
  };

  const fetchMapsUrl = async () => {
    const name = form.name?.trim();
    if (!name) return;
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=5&accept-language=ja&countrycodes=jp`,
        { headers: { 'User-Agent': 'HokkaidoTripApp/1.0' } }
      );
      const data: { lat: string; lon: string; display_name: string }[] = await res.json();

      if (data.length === 0) {
        setFetchResult({ type: 'none' });
      } else if (data.length >= 5) {
        setFetchResult({ type: 'too_many' });
      } else if (data.length === 1) {
        const p = data[0];
        const url = `https://maps.google.com/?q=${p.lat},${p.lon}`;
        set('maps_url', url);
        setFetchResult({ type: 'found', label: p.display_name.split(',')[0], url });
      } else {
        setFetchResult({
          type: 'multiple',
          candidates: data.map((p) => ({
            label: p.display_name.split(',').slice(0, 2).join('、'),
            url: `https://maps.google.com/?q=${p.lat},${p.lon}`,
          })),
        });
      }
    } catch {
      setFetchResult({ type: 'error' });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!isTransport && !form.name?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
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
              <ChipPicker
                label="所要時間"
                value={form.transport_duration ?? ''}
                onChange={(v) => set('transport_duration', v)}
                chips={TRANSPORT_DURATION_CHIPS}
                placeholder="例: 約30分"
              />
              <Field
                label="メモ（駐車場情報など）"
                value={form.transport_memo ?? ''}
                onChange={(v) => set('transport_memo', v)}
                placeholder="例: 道の駅で休憩"
                multiline
              />
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
              <Field
                label="場所名 *"
                value={form.name ?? ''}
                onChange={(v) => set('name', v)}
                placeholder="例: 美瑛の丘"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="時刻"
                  type="time"
                  value={form.time ?? ''}
                  onChange={(v) => set('time', v)}
                  placeholder="--:--"
                />
                <ChipPicker
                  label="所要時間"
                  value={form.duration ?? ''}
                  onChange={(v) => set('duration', v)}
                  chips={DURATION_CHIPS}
                  placeholder="例: 1時間"
                />
              </div>
              <Field
                label="説明文"
                value={form.description ?? ''}
                onChange={(v) => set('description', v)}
                placeholder="場所の説明や見どころ"
                multiline
              />
              <ChipPicker
                label="営業時間"
                value={form.business_hours ?? ''}
                onChange={(v) => set('business_hours', v)}
                chips={HOURS_CHIPS}
                placeholder="例: 9:00〜17:00"
              />
              <Field
                label="メモ"
                value={form.memo ?? ''}
                onChange={(v) => set('memo', v)}
                placeholder="個人的なメモ"
                multiline
              />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500">GoogleマップURL</label>
                  <button
                    type="button"
                    onClick={fetchMapsUrl}
                    disabled={!form.name?.trim() || fetching}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-light text-sky text-[11px] font-semibold hover:bg-sky hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {fetching ? (
                      <span className="animate-spin inline-block">⟳</span>
                    ) : (
                      <span>📍</span>
                    )}
                    {fetching ? '検索中...' : '自動取得'}
                  </button>
                </div>
                <input
                  type="text"
                  value={form.maps_url ?? ''}
                  onChange={(e) => set('maps_url', e.target.value || '')}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
                />

                {/* 取得結果フィードバック */}
                {fetchResult && (
                  <div className="mt-2">
                    {fetchResult.type === 'found' && (
                      <p className="text-xs text-nature font-medium flex items-center gap-1">
                        <span>✅</span> {fetchResult.label} を特定しました
                      </p>
                    )}
                    {(fetchResult.type === 'none' || fetchResult.type === 'too_many' || fetchResult.type === 'error') && (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-400">
                          {fetchResult.type === 'none' && '場所を特定できませんでした'}
                          {fetchResult.type === 'too_many' && '候補が多すぎて特定できませんでした'}
                          {fetchResult.type === 'error' && '取得エラー。ネットワークを確認してください'}
                        </p>
                        {form.name?.trim() && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(form.name.trim())}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-[11px] text-sky font-semibold hover:underline"
                          >
                            🔍 Googleマップで探す
                          </a>
                        )}
                      </div>
                    )}
                    {fetchResult.type === 'multiple' && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">候補が複数あります。選択してください：</p>
                        <div className="flex flex-col gap-1.5">
                          {fetchResult.candidates.map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                set('maps_url', c.url);
                                setFetchResult({ type: 'found', label: c.label, url: c.url });
                              }}
                              className="text-left px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:border-sky hover:bg-sky-light transition-colors"
                            >
                              📍 {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

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
