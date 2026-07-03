"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny site-wide language context (en / es).
//
// Detection: a manual choice (persisted in localStorage) always wins; otherwise
// we use the BROWSER language — a better signal than IP geolocation (an
// Argentine abroad still reads Spanish; an English speaker in Argentina still
// reads English), needs no external service, and resolves instantly on the
// client. The navbar switch covers any wrong guess.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "en" | "es";
const STORAGE_KEY = "nikoalerce:lang";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  // Server render is always EN; the effect below corrects it before paint settles.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") {
      setLangState(saved);
      return;
    }
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("es")) setLangState("es");
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
