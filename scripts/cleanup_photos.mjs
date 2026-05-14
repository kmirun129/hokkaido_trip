import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxgigqrqmupofkthbtdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2lncXJxbXVwb2ZrdGhidGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTkyNjEsImV4cCI6MjA5NDIzNTI2MX0.AU4TeMYwzTWNLxS4yaBiKl5BIdb3joPuI2Xpa34aPiw'
);

// Wikipedia 検索が誤マッチした場所（実物と関係ない画像が入った）
const badNames = [
  'フクロウ亭（ジンギスカン）',
  '豚丼 小豚屋',
  'カムイ岬',
  '札幌ラーメン 彩未',
  'レンタカー返却',
];

const { data: items } = await supabase.from('trip_items').select('id, name').in('name', badNames);
for (const item of items) {
  const { data: photos } = await supabase.from('place_photos').select('*').eq('trip_item_id', item.id);
  for (const photo of photos) {
    await supabase.storage.from('place-photos').remove([photo.storage_path]);
    await supabase.from('place_photos').delete().eq('id', photo.id);
  }
  console.log(`cleaned: ${item.name} (${photos.length} photos)`);
}
