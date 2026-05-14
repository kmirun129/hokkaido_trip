"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { useMode } from "@/lib/mode";
import { getClient } from "@/lib/supabase";

type Props = { day: number };

export default function DayTheme({ day }: Props) {
  const { settings, refresh } = useSettings();
  const { mode } = useMode();
  const isEdit = mode === "edit";
  const themes = (settings.day_themes ?? {}) as Record<string, string>;
  const current = themes[String(day)] ?? "";
  const [value, setValue] = useState(current);

  useEffect(() => {
    setValue(current);
  }, [current]);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === current) return;
    const next = { ...themes };
    if (trimmed) next[String(day)] = trimmed;
    else delete next[String(day)];
    const { error } = await getClient()
      .from("trip_settings")
      .update({ day_themes: next })
      .eq("id", 1);
    if (!error) await refresh();
  };

  // プレビュー：未設定なら何も出さない
  if (!isEdit && !current) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="relative rounded-2xl px-5 py-3.5 bg-gradient-to-r from-sky-light via-lavender-light to-nature-light overflow-hidden">
        {/* 装飾の線・ドット */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky via-lavender to-nature opacity-60" />
        <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase mb-0.5 ml-1">
          Day {day} Theme
        </div>
        {isEdit ? (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            placeholder="例: 札幌・小樽食べ歩き"
            className="w-full bg-transparent text-base font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none ml-1"
          />
        ) : (
          <div className="text-base font-bold text-slate-700 ml-1">{current}</div>
        )}
      </div>
    </div>
  );
}
