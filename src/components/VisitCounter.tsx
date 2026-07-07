"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Visitor counter. Uses Abacus (abacus.jasoncameron.dev) — a free, no-signup,
// CORS-enabled counter API — so the count costs ZERO Vercel resources (the
// browser talks to the counter service directly; no function, no KV, no card).
//
// Counting rule: one hit per browser SESSION (a sessionStorage flag), so it
// approximates "people visiting" rather than raw page loads — moving between
// pages doesn't inflate it. If the service is ever unreachable the component
// simply renders nothing, so the footer never shows a broken widget.
// ─────────────────────────────────────────────────────────────────────────────

const NS = "nikoalerce-art";
const KEY = "visits";
const SESSION_FLAG = "nk_counted";

export default function VisitCounter() {
  const { lang } = useLang();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const counted = sessionStorage.getItem(SESSION_FLAG) === "1";
    const url = `https://abacus.jasoncameron.dev/${counted ? "get" : "hit"}/${NS}/${KEY}`;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { value?: number }) => {
        if (cancelled || typeof d.value !== "number") return;
        sessionStorage.setItem(SESSION_FLAG, "1");
        setCount(d.value);
      })
      .catch(() => {
        /* counter service unreachable — show nothing */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center gap-2" title={lang === "es" ? "Personas que visitaron el sitio" : "People who visited the site"}>
      <span className="w-1.5 h-1.5 bg-accent/70 rounded-full" />
      <span>
        {count.toLocaleString(lang === "es" ? "es-AR" : "en-US")}{" "}
        {lang === "es" ? "visitas" : "visits"}
      </span>
    </div>
  );
}
