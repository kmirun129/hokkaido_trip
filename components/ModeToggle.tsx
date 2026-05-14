"use client";

import { useMode } from "@/lib/mode";

export default function ModeToggle() {
  const { mode, toggle } = useMode();
  const isEdit = mode === "edit";

  return (
    <button
      onClick={toggle}
      className={`fixed top-3 right-3 z-40 h-7 px-2.5 rounded-full flex items-center text-[10px] font-medium transition-all backdrop-blur-md ${
        isEdit
          ? "bg-accent/90 text-white shadow hover:bg-accent"
          : "bg-white/40 text-white/80 hover:bg-white/60 hover:text-white"
      }`}
      title={isEdit ? "プレビューに戻る" : "編集モードに切替"}
    >
      {isEdit ? "編集中" : "プレビュー"}
    </button>
  );
}
