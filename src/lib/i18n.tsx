"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny site-wide language context (en / es).
//
// Detection priority: a manual choice via the switch (persisted in the `nk_lang`
// cookie) always wins → else the country by IP (middleware.ts sets the same
// cookie on first visit from the Vercel geo header) → else the browser language
// (fallback for local dev / no-geo). The cookie is shared with the middleware so
// server and client agree.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "en" | "es";
const COOKIE_KEY = "nk_lang";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  // Server render is always EN; the effect below corrects it before paint settles.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = readCookie(COOKIE_KEY); // set by the switch, or by IP in middleware
    if (saved === "en" || saved === "es") {
      setLangState(saved);
      return;
    }
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("es")) setLangState("es");
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.cookie = `${COOKIE_KEY}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
