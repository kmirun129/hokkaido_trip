export type PlaceType = '観光' | '食事' | '宿泊' | '体験' | 'その他';
export type TransportMode = '徒歩' | '車' | '電車' | 'バス' | '飛行機' | 'タクシー' | 'フェリー';

export type TripItem = {
  id: number;
  day: number;
  order_index: number;
  item_type: 'place' | 'transport';
  place_type: PlaceType | null;
  name: string | null;
  time: string | null;
  duration: string | null;
  description: string | null;
  memo: string | null;
  business_hours: string | null;
  maps_url: string | null;
  transport_mode: TransportMode | null;
  transport_duration: string | null;
  transport_memo: string | null;
  created_at: string;
};

export type NewTripItem = Omit<TripItem, 'id' | 'created_at'>;

export type PlacePhoto = {
  id: number;
  trip_item_id: number;
  storage_path: string;
  order_index: number;
  created_at: string;
};
