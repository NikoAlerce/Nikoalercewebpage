"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Public visitor counter (footer). Reads from /api/stats/public — our own
// token-backed endpoint — instead of GoatCounter's /counter widget, which is
// heavily cached (updates ~hourly) and lagged behind reality. Ours refreshes
// every 5 min and is accurate. It exposes only total + countries (never
// referrers/pages), so it's safe to show to anyone.
//
// Shows "N visitas" plus a compact "· desde M países" whose tooltip lists the
// top countries. If the endpoint is unreachable it renders nothing, so the
// footer never shows a broken widget.
// ─────────────────────────────────────────────────────────────────────────────

type Country = { name: string; count: number };

export default function VisitCounter() {
  const { lang } = useLang();
  const [total, setTotal] = useState<number | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/public")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { total?: number; countries?: Country[] }) => {
        if (cancelled || typeof d.total !== "number") return;
        setTotal(d.total);
        setCountries((d.countries ?? []).filter((c) => c.count > 0));
      })
      .catch(() => {
        /* endpoint unreachable — show nothing */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (total === null) return null;

  const nf = new Intl.NumberFormat(lang === "es" ? "es-AR" : "en-US");
  const countryTip = countries.map((c) => `${c.name} (${nf.format(c.count)})`).join(" · ");

  return (
    <div className="flex items-center gap-2" title={lang === "es" ? "Visitas al sitio" : "Site visits"}>
      <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
      <span>
        {nf.format(total)} {lang === "es" ? "visitas" : "visits"}
      </span>
      {countries.length > 0 && (
        <span className="text-ash/70" title={countryTip}>
          · {lang === "es" ? `desde ${countries.length} ${countries.length === 1 ? "país" : "países"}` : `from ${countries.length} ${countries.length === 1 ? "country" : "countries"}`}
        </span>
      )}
    </div>
  );
}
