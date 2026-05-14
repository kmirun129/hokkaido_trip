import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { TripItem, NewTripItem, PlacePhoto, TripSettings, NewTripSettings } from "@/types";

type NewPlacePhoto = Omit<PlacePhoto, 'id' | 'created_at'>;

type Database = {
  public: {
    Tables: {
      trip_items: {
        Row: TripItem;
        Insert: NewTripItem;
        Update: Partial<NewTripItem>;
        Relationships: [];
      };
      place_photos: {
        Row: PlacePhoto;
        Insert: NewPlacePhoto;
        Update: Partial<NewPlacePhoto>;
        Relationships: [];
      };
      trip_settings: {
        Row: TripSettings;
        Insert: Partial<NewTripSettings> & { id?: number };
        Update: Partial<NewTripSettings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let _client: SupabaseClient<Database> | null = null;

export function getClient(): SupabaseClient<Database> {
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
