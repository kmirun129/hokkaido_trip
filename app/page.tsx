"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import DayTabs from "@/components/DayTabs";
import PlaceCard from "@/components/PlaceCard";
import TransportBar from "@/components/TransportBar";
import ItemModal from "@/components/ItemModal";
import ModeToggle from "@/components/ModeToggle";
import { getClient } from "@/lib/supabase";
import { useMode } from "@/lib/mode";
import { TripItem, NewTripItem } from "@/types";

type ModalMode =
  | { type: 'add-place'; day: number; orderIndex: number }
  | { type: 'add-transport'; day: number; orderIndex: number }
  | { type: 'edit'; item: TripItem };

export default function Home() {
  const { mode } = useMode();
  const isEdit = mode === "edit";
  const [activeDay, setActiveDay] = useState(1);
  const [items, setItems] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode | null>(null);

  const fetchItems = useCallback(async (day: number) => {
    setLoading(true);
    const { data } = await getClient()
      .from('trip_items')
      .select('*')
      .eq('day', day)
      .order('order_index', { ascending: true });
    setItems((data as TripItem[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems(activeDay);
  }, [activeDay, fetchItems]);

  const handleDayChange = (day: number) => {
    setActiveDay(day);
  };

  const nextOrder = () =>
    items.length > 0 ? Math.max(...items.map((i) => i.order_index)) + 10 : 10;

  const handleSave = async (data: NewTripItem) => {
    if (modal?.type === 'edit') {
      await getClient()
        .from('trip_items')
        .update(data)
        .eq('id', modal.item.id);
    } else {
      await getClient().from('trip_items').insert(data);
    }
    setModal(null);
    await fetchItems(activeDay);
  };

  const handleDelete = async (item: TripItem) => {
    if (!confirm(`「${item.name ?? '移動'}」を削除しますか？`)) return;
    await getClient().from('trip_items').delete().eq('id', item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const swapOrder = async (indexA: number, indexB: number) => {
    const a = items[indexA];
    const b = items[indexB];
    if (!a || !b) return;
    await Promise.all([
      getClient().from('trip_items').update({ order_index: b.order_index }).eq('id', a.id),
      getClient().from('trip_items').update({ order_index: a.order_index }).eq('id', b.id),
    ]);
    await fetchItems(activeDay);
  };

  const places = items.filter((i) => i.item_type === 'place');

  return (
    <div className="min-h-screen">
      <ModeToggle />
      <Header />
      <DayTabs activeDay={activeDay} onDayChange={handleDayChange} />

      {/* ジャンプナビ */}
      {places.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {places.map((p) => (
              <a
                key={p.id}
                href={`#place-${p.id}`}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white border border-sky/30 text-sky text-xs font-medium hover:bg-sky hover:text-white transition-colors shadow-sm"
              >
                {p.name ?? '場所'}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className={`max-w-2xl mx-auto px-4 ${isEdit ? 'pb-32' : 'pb-12'}`}>
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-slate-400 text-sm mb-6">まだプランがありません</p>
            {isEdit && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setModal({ type: 'add-place', day: activeDay, orderIndex: nextOrder() })}
                  className="px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-sky/90 transition-colors"
                >
                  ＋ 場所を追加
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 pt-2">
            {items.map((item, idx) => {
              const pos = items.indexOf(item);
              if (item.item_type === 'transport') {
                return (
                  <TransportBar
                    key={item.id}
                    item={item}
                    onEdit={() => setModal({ type: 'edit', item })}
                    onDelete={() => handleDelete(item)}
                  />
                );
              }
              const placeItems = items.filter((i) => i.item_type === 'place');
              const placePos = placeItems.indexOf(item);
              return (
                <PlaceCard
                  key={item.id}
                  item={item}
                  onEdit={() => setModal({ type: 'edit', item })}
                  onDelete={() => handleDelete(item)}
                  onMoveUp={() => swapOrder(pos, pos - 1)}
                  onMoveDown={() => swapOrder(pos, pos + 1)}
                  isFirst={placePos === 0 && idx === 0}
                  isLast={idx === items.length - 1}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* 固定追加ボタン（編集モードのみ） */}
      {isEdit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          <button
            onClick={() => setModal({ type: 'add-transport', day: activeDay, orderIndex: nextOrder() })}
            className="flex items-center gap-2 px-4 py-3 bg-white text-slate-600 rounded-2xl shadow-lg border border-slate-100 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            🚗 移動を追加
          </button>
          <button
            onClick={() => setModal({ type: 'add-place', day: activeDay, orderIndex: nextOrder() })}
            className="flex items-center gap-2 px-5 py-3 bg-sky text-white rounded-2xl shadow-lg text-sm font-semibold hover:bg-sky/90 transition-colors"
          >
            ＋ 場所を追加
          </button>
        </div>
      )}

      {/* モーダル */}
      {modal && (
        <ItemModal
          mode={modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
