"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Mode = "preview" | "edit";
type Ctx = { mode: Mode; setMode: (m: Mode) => void; toggle: () => void };

const ModeContext = createContext<Ctx>({
  mode: "preview",
  setMode: () => {},
  toggle: () => {},
});

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("preview");

  useEffect(() => {
    const saved = localStorage.getItem("trip-mode");
    if (saved === "edit" || saved === "preview") setModeState(saved);
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    localStorage.setItem("trip-mode", m);
  };

  const toggle = () => setMode(mode === "preview" ? "edit" : "preview");

  return (
    <ModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);
