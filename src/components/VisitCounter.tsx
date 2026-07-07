"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Visitor counter. Reads from GoatCounter — the SAME service that Analytics.tsx
// already feeds — so what we display is exactly what we track (single source of
// truth), and it still costs ZERO Vercel resources (the browser talks to the
// counter endpoint directly; no function, no KV, no card).
//
// GoatCounter's count.js records the pageview itself, so here we only READ:
//   GET /counter/TOTAL.json → { "count": "1,234", "count_unique": "1,000" }
// We show count_unique ("people who visited"), not raw pageviews. The endpoint
// must have the "visitor counter" enabled in the GoatCounter site settings.
// If it's ever unreachable the component renders nothing, so the footer never
// shows a broken widget.
// ─────────────────────────────────────────────────────────────────────────────

const COUNTER_URL = "https://nikoalerce.goatcounter.com/counter/TOTAL.json";

export default function VisitCounter() {
  const { lang } = useLang();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(COUNTER_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { count_unique?: string }) => {
        // GoatCounter returns formatted strings (e.g. "1,234") — strip anything
        // that isn't a digit before parsing so separators never break it.
        const n = parseInt(String(d.count_unique ?? "").replace(/\D/g, ""), 10);
        if (cancelled || !Number.isFinite(n)) return;
        setCount(n);
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
