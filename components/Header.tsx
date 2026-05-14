"use client";

import { useEffect, useState, useCallback } from "react";
import { getClient } from "@/lib/supabase";
import { TripSettings } from "@/types";
import { useMode } from "@/lib/mode";
import HeroSettingsModal from "./HeroSettingsModal";

const BUCKET = "place-photos";

function publicUrl(path: string) {
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function Header() {
  const { mode } = useMode();
  const [settings, setSettings] = useState<TripSettings | null>(null);
  const [editing, setEditing] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await getClient()
      .from("trip_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    setSettings((data as TripSettings | null) ?? null);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const heroUrl = settings?.hero_image_path ? publicUrl(settings.hero_image_path) : null;
  const isEdit = mode === "edit";

  return (
    <>
      <header className="relative overflow-hidden">
        <div
          className="min-h-56 flex flex-col items-center justify-center px-6 py-10 text-white relative bg-cover bg-center"
          style={
            heroUrl
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(91,163,217,0.65) 0%, rgba(155,126,200,0.55) 55%, rgba(91,168,95,0.65) 100%), url(${heroUrl})`,
                }
              : undefined
          }
        >
          {!heroUrl && <div className="absolute inset-0 hero-gradient" />}
          {!heroUrl && (
            <>
              <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/10" />
              <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-white/10" />
              <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/10" />
            </>
          )}

          <div className="relative text-center z-10">
            <div className="text-sm font-medium tracking-widest text-white/80 mb-2 uppercase">
              Hokkaido Trip
            </div>
            <h1 className="text-4xl font-bold mb-3 drop-shadow-sm">
              🌿 {settings?.title ?? "..."}
            </h1>
            <p className="text-white/90 text-base font-medium">
              {settings?.subtitle ?? ""} ・ {settings?.duration_label ?? ""}
            </p>
            {settings && settings.tags.length > 0 && (
              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                {settings.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isEdit && (
            <button
              onClick={() => setEditing(true)}
              className="absolute top-3 left-3 z-20 h-9 px-3 rounded-full bg-white/30 backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold text-white hover:bg-white/45 transition-colors"
              title="ヘッダーを編集"
            >
              <span>⚙️</span>
              <span>ヘッダー編集</span>
            </button>
          )}
        </div>
      </header>

      {editing && settings && (
        <HeroSettingsModal
          settings={settings}
          onClose={() => setEditing(false)}
          onSaved={(s) => {
            setSettings(s);
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
