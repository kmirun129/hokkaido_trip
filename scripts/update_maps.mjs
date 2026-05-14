import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxgigqrqmupofkthbtdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2lncXJxbXVwb2ZrdGhidGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTkyNjEsImV4cCI6MjA5NDIzNTI2MX0.AU4TeMYwzTWNLxS4yaBiKl5BIdb3joPuI2Xpa34aPiw'
);

const q = (place) => `https://maps.google.com/?q=${encodeURIComponent(place)}`;

const updates = [
  // 1日目
  { name: '支笏湖',                             url: q('支笏湖 千歳') },
  { name: '札幌ラーメン 彩未',                  url: q('札幌ラーメン彩未') },
  { name: 'ROYCEカカオチョコレートタウン',       url: q('ロイズカカオ&チョコレートタウン') },
  { name: '札幌ビール園',                        url: q('札幌ビール園') },
  { name: 'フクロウ亭（ジンギスカン）',          url: q('フクロウ亭 すすきの') },
  { name: 'パフェ、珈琲、酒、佐藤本店',          url: q('パフェ珈琲酒佐藤本店 札幌') },

  // 2日目
  { name: '回転寿司 根室花まる JRタワーステラプレイス店', url: q('根室花まる JRタワーステラプレイス店') },
  { name: '白い恋人パーク',                      url: q('白い恋人パーク') },
  { name: '小樽運河',                            url: q('小樽運河') },
  { name: '小樽堺町通り商店街 食べ歩き',         url: q('小樽堺町通り商店街') },
  { name: '豚丼 小豚屋',                         url: q('豚丼小豚屋 札幌') },
  { name: '藻岩山 山頂展望台 夜景',              url: q('藻岩山展望台') },

  // 3日目
  { name: 'ファーム富田',                        url: q('ファーム富田') },
  { name: 'オムカレー 唯我独尊',                 url: q('唯我独尊 富良野') },
  { name: '美瑛放牧酪農場',                      url: q('美瑛放牧酪農場') },
  { name: '旭山動物園',                          url: q('旭山動物園') },

  // 4日目
  { name: 'KINGBEAR美瑛店',                      url: q('KINGBEAR美瑛店') },
  { name: '白金 青い池・白ひげの滝',             url: q('白金青い池 美瑛') },
  { name: '富良野ピザ工房・ミルク工房',          url: q('富良野ピザ工房') },
];

let ok = 0, ng = 0;
for (const { name, url } of updates) {
  const { error } = await supabase
    .from('trip_items')
    .update({ maps_url: url })
    .eq('name', name);
  if (error) { console.error(`❌ ${name}:`, error.message); ng++; }
  else       { console.log(`✅ ${name}`); ok++; }
}

console.log(`\n完了: ${ok}件更新, ${ng}件エラー`);
