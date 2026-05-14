import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxgigqrqmupofkthbtdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2lncXJxbXVwb2ZrdGhidGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTkyNjEsImV4cCI6MjA5NDIzNTI2MX0.AU4TeMYwzTWNLxS4yaBiKl5BIdb3joPuI2Xpa34aPiw'
);

const place = (day, order, { name, time, type = '観光', desc, memo, hours } = {}) => ({
  day, order_index: order, item_type: 'place',
  place_type: type, name, time: time ?? null,
  duration: null, description: desc ?? null, memo: memo ?? null,
  business_hours: hours ?? null, maps_url: null,
  transport_mode: null, transport_duration: null, transport_memo: null,
});

const move = (day, order, { mode = '車', duration, memo } = {}) => ({
  day, order_index: order, item_type: 'transport',
  transport_mode: mode, transport_duration: duration ?? null, transport_memo: memo ?? null,
  place_type: null, name: null, time: null, duration: null,
  description: null, memo: null, business_hours: null, maps_url: null,
});

const items = [
  // ─── 1日目 6/4(木) ───────────────────────────────────────────
  place(1, 10,  { name: '新千歳空港着', time: '8:25', type: 'その他', desc: '朝食購入' }),
  move (1, 15,  { mode: '車', duration: '約1時間30分', memo: 'レンタカー手続き後' }),
  place(1, 20,  { name: 'レンタカー', time: '10:00', type: '体験' }),
  move (1, 25,  { mode: '車', duration: '約30分' }),
  place(1, 30,  { name: '支笏湖', time: '10:30', type: '観光',
    desc: 'ビジターセンター / 山線鉄橋 / ポロピナイ展望台' }),
  move (1, 35,  { mode: '車', duration: '約1時間' }),
  place(1, 40,  { name: '札幌ラーメン 彩未', time: '12:30', type: '食事' }),
  move (1, 45,  { mode: '車', duration: '約15分' }),
  place(1, 50,  { name: 'ROYCEカカオチョコレートタウン', time: '13:30', type: '体験' }),
  move (1, 55,  { mode: '車', duration: '約20分' }),
  place(1, 60,  { name: 'ホテルアネックス チェックイン', time: '15:30', type: '宿泊' }),
  move (1, 65,  { mode: 'タクシー', duration: '約15分' }),
  place(1, 70,  { name: '札幌ビール園', time: '16:30', type: '食事' }),
  move (1, 75,  { mode: '徒歩' }),
  place(1, 80,  { name: 'すすきの散策', time: '18:00', type: '観光',
    desc: 'ニッカウイスキー看板 / 狸小路商店街' }),
  move (1, 85,  { mode: '徒歩' }),
  place(1, 90,  { name: 'フクロウ亭（ジンギスカン）', time: '19:00', type: '食事', memo: '予約済' }),
  move (1, 95,  { mode: '徒歩' }),
  place(1, 100, { name: 'パフェ、珈琲、酒、佐藤本店', time: '21:00', type: '食事' }),

  // ─── 2日目 6/5(金) ───────────────────────────────────────────
  place(2, 10,  { name: 'ホテル出発・札幌駅周辺駐車場', time: '9:00', type: 'その他' }),
  move (2, 15,  { mode: '徒歩' }),
  place(2, 20,  { name: 'セイコーマート 朝ご飯', time: '9:30', type: '食事' }),
  move (2, 25,  { mode: '徒歩' }),
  place(2, 30,  { name: 'はなまる整理券・札幌駅散策', time: '9:45', type: '観光',
    desc: '六花亭 札幌本店 / JRタワー / 赤れんが庁舎・テラス' }),
  move (2, 35,  { mode: '徒歩' }),
  place(2, 40,  { name: '回転寿司 根室花まる JRタワーステラプレイス店', time: '11:00', type: '食事' }),
  move (2, 45,  { mode: '車', duration: '約30分' }),
  place(2, 50,  { name: '白い恋人パーク', time: '12:30', type: '観光' }),
  move (2, 55,  { mode: '車', duration: '約40分' }),
  place(2, 60,  { name: '小樽運河', time: '14:00', type: '観光' }),
  move (2, 65,  { mode: '徒歩' }),
  place(2, 70,  { name: '小樽堺町通り商店街 食べ歩き', time: '14:30', type: '食事',
    desc: 'かま栄（ヒラ天・パンロール）/ タケダのザンギ / なると ザンギ / ルタオ' }),
  move (2, 75,  { mode: '車', duration: '約1時間' }),
  place(2, 80,  { name: 'ホテル帰着・休憩', time: '17:30', type: 'その他' }),
  move (2, 85,  { mode: '徒歩' }),
  place(2, 90,  { name: '札幌散歩', time: '18:00', type: '観光',
    desc: 'さっぽろテレビ塔 / 大通公園 / どんぐり大通り店（ちくわぱん） / kinotoya大通公園店 ソフトクリーム' }),
  move (2, 95,  { mode: '徒歩' }),
  place(2, 100, { name: '豚丼 小豚屋', time: '19:00', type: '食事' }),
  move (2, 105, { mode: '車' }),
  place(2, 110, { name: '藻岩山 山頂展望台 夜景', time: '20:00', type: '観光' }),

  // ─── 3日目 6/6(土) ───────────────────────────────────────────
  place(3, 10,  { name: 'ホテル出発', time: '7:00', type: 'その他' }),
  move (3, 15,  { mode: '車', duration: '約2時間' }),
  place(3, 20,  { name: 'ファーム富田', time: '9:00', type: '観光' }),
  move (3, 25,  { mode: '車', duration: '約30分' }),
  place(3, 30,  { name: 'オムカレー 唯我独尊', time: '11:00', type: '食事' }),
  move (3, 35,  { mode: '車', duration: '約15分' }),
  place(3, 40,  { name: '美瑛放牧酪農場', time: '12:30', type: '体験',
    desc: 'ソフトクリーム / ラクレットチーズトースト' }),
  move (3, 45,  { mode: '車', duration: '約40分' }),
  place(3, 50,  { name: '旭山動物園', time: '14:30', type: '観光' }),
  move (3, 55,  { mode: '車', duration: '約20分' }),
  place(3, 60,  { name: 'ホテルアマネク旭川 チェックイン', time: '18:00', type: '宿泊' }),
  move (3, 65,  { mode: '徒歩' }),
  place(3, 70,  { name: '旭川居酒屋巡り', time: '18:30', type: '食事',
    desc: '新子焼き ぎんねこ / 旭川ラーメン 天金 / 塩ホルモン 炭や' }),

  // ─── 4日目 6/7(日) ───────────────────────────────────────────
  place(4, 10,  { name: 'KINGBEAR美瑛店', time: '10:30', type: '観光' }),
  move (4, 15,  { mode: '車', duration: '約10分' }),
  place(4, 20,  { name: 'とうきび', time: '11:15', type: '食事',
    desc: 'コーンジェラート モーグリの家 / コーンスープとパン キッチンひとさじ' }),
  move (4, 25,  { mode: '車', duration: '約20分' }),
  place(4, 30,  { name: '白金 青い池・白ひげの滝', time: '12:00', type: '観光' }),
  move (4, 35,  { mode: '車', duration: '約50分' }),
  place(4, 40,  { name: '富良野ピザ工房・ミルク工房', time: '13:30', type: '食事' }),
  move (4, 45,  { mode: '車', duration: '約2時間' }),
  place(4, 50,  { name: 'レンタカー返却', time: '16:00', type: 'その他' }),
  move (4, 55,  { mode: '車', duration: '約15分' }),
  place(4, 60,  { name: '新千歳空港着', time: '16:30', type: 'その他' }),
  place(4, 70,  { name: '新千歳空港発 ✈️', time: '21:00', type: 'その他' }),
];

// 既存データを削除してから挿入
const { error: delError } = await supabase.from('trip_items').delete().gte('id', 0);
if (delError) { console.error('削除エラー:', delError); process.exit(1); }

const { error } = await supabase.from('trip_items').insert(items);
if (error) {
  console.error('挿入エラー:', error);
  process.exit(1);
}
console.log(`✅ ${items.length}件のデータを登録しました`);
