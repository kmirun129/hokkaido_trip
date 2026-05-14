"use client";

import { useState, useEffect } from "react";
import { TripItem, PlaceType, TransportMode, NewTripItem } from "@/types";
import { TIME_OPTIONS, DURATION_OPTIONS, BusinessHours, HoursBlock, parseHours } from "@/lib/hours";

const PLACE_TYPES: PlaceType[] = ['観光', '食事', '宿泊', '体験', 'その他'];
const TRANSPORT_MODES: TransportMode[] = ['徒歩', '車', '電車', 'バス', '飛行機', 'タクシー', 'フェリー'];
const TRANSPORT_DURATION_CHIPS = ['約5分', '約10分', '約15分', '約20分', '約30分', '約1時間', '約1時間30分', '約2時間'];
const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'] as const;

type ModalMode =
  | { type: 'add-place'; day: number; orderIndex: number }
  | { type: 'add-transport'; day: number; orderIndex: number }
  | { type: 'edit'; item: TripItem };

type Props = {
  mode: ModalMode;
  onSave: (data: NewTripItem) => Promise<void>;
  onClose: () => void;
};

// ── 汎用フィールド ────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, multiline, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40 resize-none" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40" />
      )}
    </div>
  );
}

// ── 所要時間セレクト ──────────────────────────────────────────
function DurationSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">所要時間</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40 bg-white">
        {DURATION_OPTIONS.map((o) => (
          <option key={o} value={o}>{o === '' ? '未設定' : o}</option>
        ))}
      </select>
    </div>
  );
}

// ── 営業時間ピッカー ──────────────────────────────────────────
function HoursBlockPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const parsed = parseHours(value);
  const [blocks, setBlocks] = useState<HoursBlock[]>(parsed?.blocks ?? []);
  const [closed, setClosed] = useState<string[]>(parsed?.closed ?? []);

  const emit = (b: HoursBlock[], c: string[]) => {
    if (b.length === 0 && c.length === 0) { onChange(null); }
    else { onChange(JSON.stringify({ v: 1, blocks: b, closed: c } satisfies BusinessHours)); }
  };

  const addBlock = () => {
    if (blocks.length >= 2) return;
    const nb = [...blocks, { start: '10:00', end: '18:00' }];
    setBlocks(nb); emit(nb, closed);
  };
  const removeBlock = (i: number) => {
    const nb = blocks.filter((_, idx) => idx !== i);
    setBlocks(nb); emit(nb, closed);
  };
  const updateBlock = (i: number, field: keyof HoursBlock, val: string) => {
    const nb = blocks.map((b, idx) => idx === i ? { ...b, [field]: val } : b);
    setBlocks(nb); emit(nb, closed);
  };
  const toggleClosed = (day: string) => {
    const nc = closed.includes(day) ? closed.filter((d) => d !== day) : [...closed, day];
    setClosed(nc); emit(blocks, nc);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-500">営業時間</label>

      {blocks.map((block, i) => (
        <div key={i} className="flex items-center gap-2">
          <select value={block.start} onChange={(e) => updateBlock(i, 'start', e.target.value)}
            className="flex-1 px-2 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky/40">
            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-slate-400 text-sm flex-shrink-0">〜</span>
          <select value={block.end} onChange={(e) => updateBlock(i, 'end', e.target.value)}
            className="flex-1 px-2 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky/40">
            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => removeBlock(i)}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 text-xs flex items-center justify-center flex-shrink-0">✕</button>
        </div>
      ))}

      {blocks.length < 2 && (
        <button onClick={addBlock} type="button"
          className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs hover:border-sky hover:text-sky transition-colors">
          ＋ 時間帯を追加（午前・午後など）
        </button>
      )}

      <div>
        <p className="text-xs text-slate-500 mb-1.5">定休日</p>
        <div className="flex gap-1.5">
          {WEEKDAYS.map((day) => (
            <button key={day} type="button" onClick={() => toggleClosed(day)}
              className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
                closed.includes(day) ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── メインモーダル ────────────────────────────────────────────
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
        transport_mode: '車', transport_duration: null, transport_memo: null,
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
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<
    | { type: 'found'; label: string }
    | { type: 'multiple'; candidates: { label: string; url: string }[] }
    | { type: 'none' | 'too_many' | 'error' }
    | null
  >(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key: keyof NewTripItem, value: string) => {
    setForm((f) => ({ ...f, [key]: value || null }));
    if (key === 'name') setFetchResult(null);
  };

  const fetchMapsUrl = async () => {
    const name = form.name?.trim();
    if (!name) return;
    setFetching(true); setFetchResult(null);
    try {
      // 北海道バウンディングボックス: 西端,北端,東端,南端
      const HOKKAIDO_VIEWBOX = '139.3,45.6,145.9,41.3';
      const params = new URLSearchParams({
        q: `${name} 北海道`,
        format: 'json',
        limit: '5',
        'accept-language': 'ja',
        countrycodes: 'jp',
        viewbox: HOKKAIDO_VIEWBOX,
        bounded: '1',
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'User-Agent': 'HokkaidoTripApp/1.0' } }
      );
      type NominatimResult = { lat: string; lon: string; display_name: string; importance: number; name: string };
      let data: NominatimResult[] = await res.json();

      // bounded=1 で結果なし → 北海道縛りを外して再試行
      if (data.length === 0) {
        const params2 = new URLSearchParams({
          q: name,
          format: 'json',
          limit: '5',
          'accept-language': 'ja',
          countrycodes: 'jp',
        });
        const res2 = await fetch(
          `https://nominatim.openstreetmap.org/search?${params2}`,
          { headers: { 'User-Agent': 'HokkaidoTripApp/1.0' } }
        );
        data = await res2.json();
      }

      if (data.length === 0) {
        setFetchResult({ type: 'none' });
        return;
      }

      // importance スコア降順でソート
      data.sort((a, b) => b.importance - a.importance);

      // 名称なし（座標のみ）の結果は除外
      const named = data.filter((p) => p.name?.trim());
      if (named.length === 0) {
        setFetchResult({ type: 'none' });
        return;
      }

      // Nominatim 座標で正確にピン留めし、ラベルとして施設名を付与
      // `?q=NAME` だと Google Maps 側で再検索されて同名店舗の一覧になるため避ける
      const mapsUrl = (p: NominatimResult) =>
        `https://maps.google.com/?q=${p.lat},${p.lon}(${encodeURIComponent(p.name)})`;

      // 1位が2位の2倍以上のスコア → 1位を確定
      const topImportance = named[0].importance;
      const secondImportance = named[1]?.importance ?? 0;
      const isTopDominant = named.length === 1 || topImportance >= secondImportance * 2;

      if (isTopDominant) {
        set('maps_url', mapsUrl(named[0]));
        setFetchResult({ type: 'found', label: named[0].name });
      } else if (named.length >= 5) {
        setFetchResult({ type: 'too_many' });
      } else {
        setFetchResult({
          type: 'multiple',
          candidates: named.map((p) => ({
            label: `${p.name}（${p.display_name.split(',').slice(1, 3).map(s => s.trim()).join(' ')}）`,
            url: mapsUrl(p),
          })),
        });
      }
    } catch { setFetchResult({ type: 'error' }); }
    finally { setFetching(false); }
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
            {mode.type === 'edit' ? (isTransport ? '移動を編集' : '場所を編集') : (isTransport ? '移動を追加' : '場所を追加')}
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
                    <button key={m} onClick={() => set('transport_mode', m)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.transport_mode === m ? 'bg-sky text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">所要時間</label>
                <div className="flex flex-wrap gap-1.5">
                  {TRANSPORT_DURATION_CHIPS.map((c) => (
                    <button key={c} type="button" onClick={() => set('transport_duration', form.transport_duration === c ? '' : c)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${form.transport_duration === c ? 'bg-sky text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <input type="text" value={form.transport_duration ?? ''} onChange={(e) => set('transport_duration', e.target.value)}
                  placeholder="その他（例: 約45分）" className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40" />
              </div>
              <Field label="メモ（駐車場情報など）" value={form.transport_memo ?? ''} onChange={(v) => set('transport_memo', v)} placeholder="例: 道の駅で休憩" multiline />
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">種別</label>
                <div className="flex flex-wrap gap-2">
                  {PLACE_TYPES.map((t) => (
                    <button key={t} onClick={() => set('place_type', t)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.place_type === t ? 'bg-sky text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="場所名 *" value={form.name ?? ''} onChange={(v) => set('name', v)} placeholder="例: 美瑛の丘" />

              {/* 時刻・所要時間：縦並び */}
              <Field label="時刻" type="time" value={form.time ?? ''} onChange={(v) => set('time', v)} />
              <DurationSelect value={form.duration ?? ''} onChange={(v) => set('duration', v)} />

              <Field label="説明文" value={form.description ?? ''} onChange={(v) => set('description', v)} placeholder="場所の説明や見どころ" multiline />

              <HoursBlockPicker
                value={form.business_hours ?? null}
                onChange={(v) => setForm((f) => ({ ...f, business_hours: v }))}
              />

              <Field label="メモ" value={form.memo ?? ''} onChange={(v) => set('memo', v)} placeholder="個人的なメモ" multiline />

              {/* GoogleマップURL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500">GoogleマップURL</label>
                  <button type="button" onClick={fetchMapsUrl} disabled={!form.name?.trim() || fetching}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-light text-sky text-[11px] font-semibold hover:bg-sky hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    {fetching ? <span className="animate-spin inline-block">⟳</span> : <span>📍</span>}
                    {fetching ? '検索中...' : '自動取得'}
                  </button>
                </div>
                <input type="text" value={form.maps_url ?? ''} onChange={(e) => set('maps_url', e.target.value || '')}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40" />

                {/* 常時表示：Googleマップで探す */}
                <a href={`https://maps.google.com/?q=${encodeURIComponent(form.name?.trim() || '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 mt-1.5 text-xs text-sky hover:underline ${!form.name?.trim() ? 'pointer-events-none opacity-30' : ''}`}>
                  🔍 Googleマップで探す
                </a>

                {/* 取得結果フィードバック */}
                {fetchResult && (
                  <div className="mt-2">
                    {fetchResult.type === 'found' && (
                      <p className="text-xs text-nature font-medium">✅ {fetchResult.label} を特定しました</p>
                    )}
                    {(fetchResult.type === 'none' || fetchResult.type === 'too_many' || fetchResult.type === 'error') && (
                      <p className="text-xs text-slate-400">
                        {fetchResult.type === 'none' && '場所を特定できませんでした'}
                        {fetchResult.type === 'too_many' && '候補が多すぎて特定できませんでした'}
                        {fetchResult.type === 'error' && '取得エラー。ネットワークを確認してください'}
                      </p>
                    )}
                    {fetchResult.type === 'multiple' && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">候補が複数あります：</p>
                        <div className="flex flex-col gap-1.5">
                          {fetchResult.candidates.map((c, i) => (
                            <button key={i} type="button"
                              onClick={() => { set('maps_url', c.url); setFetchResult({ type: 'found', label: c.label }); }}
                              className="text-left px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:border-sky hover:bg-sky-light transition-colors">
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
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={saving || (!isTransport && !form.name?.trim())}
            className="flex-1 py-3 rounded-xl bg-sky hover:bg-sky/90 disabled:bg-sky/40 text-white font-semibold text-sm transition-colors">
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
