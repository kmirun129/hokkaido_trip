import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxgigqrqmupofkthbtdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2lncXJxbXVwb2ZrdGhidGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTkyNjEsImV4cCI6MjA5NDIzNTI2MX0.AU4TeMYwzTWNLxS4yaBiKl5BIdb3joPuI2Xpa34aPiw'
);

const UA = 'HokkaidoTripBot/1.0 (https://github.com/kmirun129/hokkaido_trip)';
const BUCKET = 'place-photos';

const cleanName = (name) => name.replace(/（.*?）|\(.*?\)/g, '').trim();

async function findArticleTitle(name) {
  const queries = [name, cleanName(name)];
  for (const q of queries) {
    const url = `https://ja.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    const title = data[1]?.[0];
    if (title) return title;
  }
  return null;
}

async function getImages(title) {
  const leadUrl = `https://ja.wikipedia.org/w/api.php?action=query&prop=pageimages|images&imlimit=20&piprop=original&format=json&titles=${encodeURIComponent(title)}`;
  const res = await fetch(leadUrl, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  const page = Object.values(data.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return [];

  const lead = page.original?.source;
  const fileTitles = (page.images || [])
    .map((i) => i.title)
    .filter((t) => /\.(jpg|jpeg|png)$/i.test(t))
    .filter((t) => !/icon|logo|symbol|map|flag|pictogram|insignia|coa[\s.]|emblem|wiki|commons|disambig|edit|location|locator/i.test(t))
    .slice(0, 8);

  let extraUrls = [];
  if (fileTitles.length > 0) {
    const infoUrl = `https://ja.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|size|mime&format=json&titles=${encodeURIComponent(fileTitles.join('|'))}`;
    const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': UA } });
    const infoData = await infoRes.json();
    extraUrls = Object.values(infoData.query?.pages || {})
      .map((p) => p.imageinfo?.[0])
      .filter((i) => i && i.mime?.startsWith('image/') && i.width >= 600)
      .map((i) => i.url);
  }

  const all = [];
  if (lead) all.push(lead);
  for (const u of extraUrls) {
    if (!all.includes(u) && all.length < 3) all.push(u);
  }
  return all;
}

async function downloadAndUpload(imageUrl, tripItemId, idx) {
  const res = await fetch(imageUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = (imageUrl.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
  const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const contentType = validExt === 'png' ? 'image/png' : validExt === 'webp' ? 'image/webp' : 'image/jpeg';
  const path = `${tripItemId}/wiki-${Date.now()}-${idx}.${validExt}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType });
  if (error) {
    console.error('  upload err:', error.message);
    return null;
  }
  return path;
}

async function main() {
  const { data: items } = await supabase
    .from('trip_items')
    .select('id, name, day, order_index')
    .eq('item_type', 'place')
    .order('day').order('order_index');

  const { data: existing } = await supabase.from('place_photos').select('trip_item_id');
  const hasPhotos = new Set(existing.map((p) => p.trip_item_id));

  let added = 0, skipped = 0, notFound = 0;
  for (const item of items) {
    if (!item.name) continue;
    if (hasPhotos.has(item.id)) { skipped++; continue; }

    process.stdout.write(`[${item.day}日目] ${item.name} ... `);
    const title = await findArticleTitle(item.name);
    if (!title) { console.log('記事なし'); notFound++; continue; }

    const urls = await getImages(title);
    if (urls.length === 0) { console.log(`記事「${title}」に画像なし`); notFound++; continue; }

    let count = 0;
    for (let i = 0; i < urls.length; i++) {
      const path = await downloadAndUpload(urls[i], item.id, i);
      if (!path) continue;
      const { error } = await supabase.from('place_photos').insert({
        trip_item_id: item.id,
        storage_path: path,
        order_index: (i + 1) * 10,
      });
      if (!error) count++;
    }
    console.log(`✓ 「${title}」から${count}枚`);
    if (count > 0) added++;
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n===結果=== 追加: ${added} / スキップ: ${skipped} / 取得不可: ${notFound}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
