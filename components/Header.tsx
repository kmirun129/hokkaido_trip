"use client";

import { useState } from "react";
import { useSettings } from "@/lib/settings";
import { getClient } from "@/lib/supabase";
import { useMode } from "@/lib/mode";
import HeroSettingsModal from "./HeroSettingsModal";

const BUCKET = "place-photos";

function publicUrl(path: string) {
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function Header() {
  const { settings, refresh } = useSettings();
  const { mode } = useMode();
  const [editing, setEditing] = useState(false);
  const isEdit = mode === "edit";

  const heroUrl = settings.hero_image_path ? publicUrl(settings.hero_image_path) : null;

  return (
    <>
      <header className="relative overflow-hidden">
        <div
          className="min-h-56 flex flex-col items-center justify-center px-6 py-10 text-white relative bg-cover bg-center"
          style={
            heroUrl
              ? {
                  backgroundImage: `linear-gradient(135deg,rgba(91,163,217,.65) 0%,rgba(155,126,200,.55) 55%,rgba(91,168,95,.65) 100%),url(${heroUrl})`,
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
              🌿 {settings.title}
            </h1>
            <p className="text-white/90 text-base font-medium">
              {settings.subtitle} ・ {settings.duration_label}
            </p>
            {settings.tags.length > 0 && (
              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                {settings.tags.map((tag) => (
                  <span key={tag} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
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
            >
              <span>⚙️</span> ヘッダー編集
            </button>
          )}
        </div>
      </header>

      {editing && (
        <HeroSettingsModal
          settings={settings}
          onClose={() => setEditing(false)}
          onSaved={async () => { await refresh(); setEditing(false); }}
        />
      )}
    </>
  );
}
