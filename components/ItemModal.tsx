"use client";

import { useState, useEffect } from "react";
import { TripItem, PlaceType, TransportMode, NewTripItem, SubTask } from "@/types";
import { TIME_OPTIONS, DURATION_OPTIONS, BusinessHours, HoursBlock, parseHours } from "@/lib/hours";
import { fetchMapsCandidate, googleMapsSearchUrl } from "@/lib/maps";

const PLACE_TYPES: PlaceType[] = ['観光', 'グルメ', '宿泊', 'レジャー', '移動', 'その他'];
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

// ── サブタスクエディタ ────────────────────────────────────────
type FetchState = 'idle' | 'loading' | 'found' | 'none' | 'error';

function SubTaskEditor({ value, onChange }: { value: SubTask[]; onChange: (v: SubTask[]) => void }) {
  const [fetchStates, setFetchStates] = useState<Record<string, FetchState>>({});

  const add = () => {
    onChange([...value, { id: crypto.randomUUID(), time: '', showTime: false, content: '', maps_url: null }]);
  };
  const remove = (id: string) => {
    onChange(value.filter((t) => t.id !== id));
    setFetchStates((s) => { const n = { ...s }; delete n[id]; return n; });
  };
  const update = (id: string, patch: Partial<SubTask>) =>
    onChange(value.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const handleFetch = async (task: SubTask) => {
    const name = task.content.trim();
    if (!name) return;
    setFetchStates((s) => ({ ...s, [task.id]: 'loading' }));
    const result = await fetchMapsCandidate(name);
    if (result.type === 'found') {
      update(task.id, { maps_url: result.url });
      setFetchStates((s) => ({ ...s, [task.id]: 'found' }));
    } else if (result.type === 'multiple') {
      // 複数候補があれば最上位を採用
      update(task.id, { maps_url: result.candidates[0].url });
      setFetchStates((s) => ({ ...s, [task.id]: 'found' }));
    } else {
      // none / too_many / error → Google Maps の検索URLにフォールバック
      // ユーザーの入力をそのまま検索クエリに使うので、Google Maps の検索精度に任せられる
      update(task.id, { maps_url: googleMapsSearchUrl(name) });
      setFetchStates((s) => ({ ...s, [task.id]: 'found' }));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500">立ち寄り・やることリスト</label>
      {value.map((task) => {
        const state = fetchStates[task.id] ?? 'idle';
        return (
          <div key={task.id} className="space-y-1.5">
            <div className="flex items-start gap-2">
              {/* 時刻表示トグル + 時刻入力 */}
              <div className="flex items-center gap-1 flex-shrink-0 pt-2">
                <button
                  type="button"
                  onClick={() => update(task.id, { showTime: !task.showTime })}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors ${
                    task.showTime ? 'bg-sky text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                  title="時刻を表示/非表示"
                >
                  時
                </button>
                {task.showTime && (
                  <input
                    type="time"
                    value={task.time}
                    onChange={(e) => update(task.id, { time: e.target.value })}
                    className="w-[84px] px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
                  />
                )}
              </div>
              {/* 内容 */}
              <input
                type="text"
                value={task.content}
                onChange={(e) => { update(task.id, { content: e.target.value }); setFetchStates((s) => ({ ...s, [task.id]: 'idle' })); }}
                placeholder="例: ロイズチョコレートワールド"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky/40"
              />
              {/* 自動取得ボタン */}
              <button
                type="button"
                onClick={() => handleFetch(task)}
                disabled={!task.content.trim() || state === 'loading'}
                title="Googleマップを自動取得"
                className={`flex-shrink-0 mt-1 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  task.maps_url ? 'bg-nature/10 text-nature hover:bg-nature/20' : 'bg-sky-light text-sky hover:bg-sky hover:text-white'
                }`}
              >
                {state === 'loading' ? <span className="animate-spin inline-block">⟳</span> : '📍'}
              </button>
              {/* 削除 */}
              <button
                type="button"
                onClick={() => remove(task.id)}
                className="flex-shrink-0 mt-1 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 text-xs flex items-center justify-center transition-colors"
              >✕</button>
            </div>
            {/* マップURL欄 + Googleマップで開くリンク（URL欄表示時のみ表示） */}
            {task.maps_url && (
              <div className="pl-[100px] space-y-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={task.maps_url}
                    onChange={(e) => update(task.id, { maps_url: e.target.value || null })}
                    placeholder="https://maps.google.com/..."
                    className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky/40"
                  />
                  <button
                    type="button"
                    onClick={() => update(task.id, { maps_url: null })}
                    className="flex-shrink-0 text-slate-400 hover:text-red-500 text-xs"
                    title="URLをクリア"
                  >×</button>
                </div>
                {task.content.trim() && (
                  <a
                    href={googleMapsSearchUrl(task.content)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky hover:underline"
                  >
                    🔍 Googleマップで開く
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs hover:border-sky hover:text-sky transition-colors"
      >
        ＋ 項目を追加
      </button>
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
        description: null, memo: null, business_hours: null, maps_url: null, sub_items: null,
      }
    : {
        day: (mode as { day: number }).day,
        order_index: (mode as { orderIndex: number }).orderIndex,
        item_type: 'place',
        place_type: '観光',
        name: null, time: null, duration: null,
        description: null, memo: null, business_hours: null, maps_url: null, sub_items: null,
        transport_mode: null, transport_duration: null, transport_memo: null,
      };

  const [form, setForm] = useState<NewTripItem>(initial);
  const [subTasks, setSubTasks] = useState<SubTask[]>(
    (mode.type === 'edit' ? mode.item.sub_items : null) ?? []
  );
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
    const result = await fetchMapsCandidate(name);
    if (result.type === 'found') {
      set('maps_url', result.url);
      setFetchResult({ type: 'found', label: result.label });
    } else if (result.type === 'multiple') {
      setFetchResult({ type: 'multiple', candidates: result.candidates });
    } else {
      setFetchResult({ type: result.type });
    }
    setFetching(false);
  };

  const handleSave = async () => {
    if (!isTransport && !form.name?.trim()) return;
    setSaving(true);
    const filled = subTasks.filter((t) => t.content.trim());
    await onSave({ ...form, sub_items: filled.length > 0 ? filled : null });
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

              <SubTaskEditor value={subTasks} onChange={setSubTasks} />

              <Field label="説明文" value={form.description ?? ''} onChange={(v) => set('description', v)} placeholder="場所の説明や見どころ" multiline />

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

              <HoursBlockPicker
                value={form.business_hours ?? null}
                onChange={(v) => setForm((f) => ({ ...f, business_hours: v }))}
              />
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
