"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getClient } from "./supabase";
import { TripSettings } from "@/types";

const DEFAULT: TripSettings = {
  id: 1,
  title: '北海道旅行',
  subtitle: '2026年 夏の旅',
  duration_label: '4日間',
  tags: ['絶景', 'グルメ', '体験', '自然'],
  hero_image_path: null,
  start_date: '2026-06-04',
  updated_at: '',
};

type Ctx = { settings: TripSettings; refresh: () => Promise<void> };
const SettingsContext = createContext<Ctx>({ settings: DEFAULT, refresh: async () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TripSettings>(DEFAULT);

  const refresh = useCallback(async () => {
    const { data } = await getClient()
      .from('trip_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (data) setSettings(data as TripSettings);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
