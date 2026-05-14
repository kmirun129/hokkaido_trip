"use client";

import { useMode } from "@/lib/mode";

export default function ModeToggle() {
  const { mode, toggle } = useMode();
  const isEdit = mode === "edit";

  return (
    <button
      onClick={toggle}
      className={`fixed top-3 right-3 z-40 h-10 px-3 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-semibold transition-all backdrop-blur-md ${
        isEdit
          ? "bg-accent text-white hover:bg-accent/90"
          : "bg-white/90 text-slate-700 hover:bg-white"
      }`}
      title={isEdit ? "プレビューに戻る" : "編集モードに切替"}
    >
      <span className="text-base leading-none">{isEdit ? "✏️" : "👁"}</span>
      <span>{isEdit ? "編集中" : "プレビュー"}</span>
    </button>
  );
}
