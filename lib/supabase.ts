import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { TripItem, NewTripItem } from "@/types";

type Database = {
  public: {
    Tables: {
      trip_items: {
        Row: TripItem;
        Insert: NewTripItem;
        Update: Partial<NewTripItem>;
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
