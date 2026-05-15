// Nominatim (OpenStreetMap) で施設を検索し、Google Maps の URL を組み立てるヘルパー。
// メイン場所と立ち寄り先で共通利用する。

export type MapsCandidate = { label: string; url: string };

export type MapsFetchResult =
  | { type: 'found'; label: string; url: string }
  | { type: 'multiple'; candidates: MapsCandidate[] }
  | { type: 'none' | 'too_many' | 'error' };

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  name: string;
  class: string;
  type: string;
};

const HOKKAIDO_VIEWBOX = '139.3,45.6,145.9,41.3';

const HIGH_CATEGORIES = new Set([
  'aeroway/aerodrome', 'aeroway/terminal',
  'tourism/zoo', 'tourism/museum', 'tourism/attraction', 'tourism/theme_park',
  'tourism/hotel', 'tourism/hostel', 'tourism/guest_house', 'tourism/viewpoint',
  'amenity/restaurant', 'amenity/cafe', 'amenity/fast_food', 'amenity/bar', 'amenity/pub',
  'shop/car_rental', 'shop/department_store', 'shop/mall', 'shop/supermarket',
  'leisure/park', 'leisure/garden',
]);

const LOW_CATEGORIES = new Set([
  'railway/stop', 'railway/halt', 'highway/bus_stop',
  'building/train_station', 'building/yes',
  'public_transport/platform', 'public_transport/stop_position',
]);

const CLASS_LABEL_MAP: Record<string, string> = {
  'aeroway/aerodrome': '空港', 'aeroway/terminal': '空港ターミナル',
  'railway/station': '駅', 'railway/halt': '駅', 'railway/stop': '駅停車場', 'railway/tram_stop': '路面電車駅',
  'highway/bus_stop': 'バス停',
  'amenity/restaurant': '飲食店', 'amenity/cafe': 'カフェ', 'amenity/fast_food': 'ファストフード',
  'amenity/bar': 'バー', 'amenity/pub': '居酒屋', 'amenity/parking': '駐車場',
  'amenity/hospital': '病院', 'amenity/bank': '銀行', 'amenity/post_office': '郵便局',
  'tourism/hotel': 'ホテル', 'tourism/hostel': 'ホステル', 'tourism/guest_house': 'ゲストハウス',
  'tourism/attraction': '観光地', 'tourism/museum': '博物館', 'tourism/zoo': '動物園',
  'tourism/viewpoint': '展望台', 'tourism/theme_park': 'テーマパーク',
  'leisure/park': '公園', 'leisure/garden': '庭園', 'leisure/nature_reserve': '自然保護区',
  'natural/peak': '山', 'natural/water': '水域', 'natural/beach': 'ビーチ',
  'shop/convenience': 'コンビニ', 'shop/supermarket': 'スーパー', 'shop/car_rental': 'レンタカー',
  'shop/department_store': 'デパート', 'shop/mall': 'モール',
  'building/train_station': '駅舎',
};

function categoryBonus(cls: string, t: string): number {
  const key = `${cls}/${t}`;
  if (HIGH_CATEGORIES.has(key)) return 0.1;
  if (LOW_CATEGORIES.has(key)) return -0.15;
  return 0;
}

function buildMapsUrl(p: NominatimResult): string {
  const parts = p.display_name
    .split(',')
    .map((s) => s.trim())
    .filter((s) =>
      s &&
      s !== '日本' &&
      !s.endsWith('振興局') &&
      !s.endsWith('地方') &&
      !/^\d{3}-?\d{4}$/.test(s)
    );
  const query = parts.join(' ');
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${p.lat},${p.lon},17z`;
}

function candidateLabel(p: NominatimResult): string {
  const parts = p.display_name.split(',').map((s) => s.trim());
  const fullName = parts[0] || p.name;
  const city = parts.find((s) => /[市町村区]$/.test(s));
  const cat = CLASS_LABEL_MAP[`${p.class}/${p.type}`] ?? null;
  const ctx = [cat, city && !fullName.includes(city) ? city : null].filter(Boolean).join('・');
  return ctx ? `${fullName}（${ctx}）` : fullName;
}

// 手動検索用：Google Maps の検索ページを直接開く URL を返す。
export function googleMapsSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim())}`;
}

async function callNominatim(query: string, hokkaidoBounded: boolean): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    'accept-language': 'ja',
    countrycodes: 'jp',
    ...(hokkaidoBounded ? { viewbox: HOKKAIDO_VIEWBOX, bounded: '1' } : {}),
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'User-Agent': 'HokkaidoTripApp/1.0' } }
  );
  return (await res.json()) as NominatimResult[];
}

// 店舗の支店サフィックスや括弧内補足を取り除いたバリエーションを生成。
// 例: "千秋庵 新千歳空港店" → ["千秋庵 新千歳空港店", "千秋庵", ...]
function nameVariations(name: string): string[] {
  const trimmed = name.trim();
  const variations = new Set<string>([trimmed]);

  // 括弧内（半角・全角）を削除
  const noParens = trimmed.replace(/[（(][^）)]*[）)]/g, '').trim();
  if (noParens) variations.add(noParens);

  // 末尾の支店名サフィックスを削除
  const suffixPatterns = [
    /\s*[・・\s][^\s・・]*(本店|支店|店)\s*$/, // 「・〇〇店」「 〇〇店」
    /(本店|支店)\s*$/,
  ];
  for (const base of [trimmed, noParens]) {
    if (!base) continue;
    for (const re of suffixPatterns) {
      const stripped = base.replace(re, '').trim();
      if (stripped && stripped !== base) variations.add(stripped);
    }
  }

  return Array.from(variations);
}

export async function fetchMapsCandidate(name: string): Promise<MapsFetchResult> {
  const trimmed = name.trim();
  if (!trimmed) return { type: 'none' };

  try {
    let data: NominatimResult[] = [];

    // ① 北海道バウンディングボックス内で原文検索
    data = await callNominatim(`${trimmed} 北海道`, true);

    // ② 縛りなしで原文検索
    if (data.length === 0) data = await callNominatim(trimmed, false);

    // ③ 支店サフィックス等を除いたバリエーションで再検索
    if (data.length === 0) {
      const variations = nameVariations(trimmed).filter((v) => v !== trimmed);
      for (const variant of variations) {
        data = await callNominatim(`${variant} 北海道`, true);
        if (data.length === 0) data = await callNominatim(variant, false);
        if (data.length > 0) break;
      }
    }

    if (data.length === 0) return { type: 'none' };

    const named = data.filter((p) => p.name?.trim());
    if (named.length === 0) return { type: 'none' };

    named.sort((a, b) =>
      (b.importance + categoryBonus(b.class, b.type)) -
      (a.importance + categoryBonus(a.class, a.type))
    );

    const topImportance = named[0].importance;
    const secondImportance = named[1]?.importance ?? 0;
    const isTopDominant = named.length === 1 || topImportance >= secondImportance * 2;

    if (isTopDominant) {
      return {
        type: 'found',
        label: named[0].display_name.split(',')[0].trim() || named[0].name,
        url: buildMapsUrl(named[0]),
      };
    } else if (named.length >= 5) {
      return { type: 'too_many' };
    } else {
      return {
        type: 'multiple',
        candidates: named.map((p) => ({ label: candidateLabel(p), url: buildMapsUrl(p) })),
      };
    }
  } catch {
    return { type: 'error' };
  }
}
