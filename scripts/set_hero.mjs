import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxgigqrqmupofkthbtdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2lncXJxbXVwb2ZrdGhidGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTkyNjEsImV4cCI6MjA5NDIzNTI2MX0.AU4TeMYwzTWNLxS4yaBiKl5BIdb3joPuI2Xpa34aPiw'
);

const UA = 'HokkaidoTripBot/1.0';
const BUCKET = 'place-photos';

// CC BY 2.0 (作者: 雷太) - 富良野ラベンダー観光スポット
// https://commons.wikimedia.org/wiki/File:Sightseeing_spot_in_Furano,_Hokkaido_Prefecture;_July_2017_(04).jpg
const IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Sightseeing_spot_in_Furano%2C_Hokkaido_Prefecture%3B_July_2017_%2804%29.jpg';
const STORAGE_PATH = 'hero/furano-lavender.jpg';

async function main() {
  console.log('Downloading hero image from Wikimedia Commons...');
  const res = await fetch(IMAGE_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  // Remove existing if any
  await supabase.storage.from(BUCKET).remove([STORAGE_PATH]);

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, buffer, { contentType: 'image/jpeg', upsert: true });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  console.log('Uploaded to Supabase Storage:', STORAGE_PATH);

  const { error: dbErr } = await supabase
    .from('trip_settings')
    .update({ hero_image_path: STORAGE_PATH })
    .eq('id', 1);
  if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`);

  console.log('Updated trip_settings.hero_image_path ✓');
  console.log('Credit: 雷太 (CC BY 2.0) via Wikimedia Commons');
}

main().catch((e) => { console.error(e); process.exit(1); });
