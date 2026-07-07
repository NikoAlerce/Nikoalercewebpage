"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Private analytics dashboard (rendered at /stats). Talks to /api/stats, which
// holds the GoatCounter API token server-side. Access is gated by a password
// (STATS_ACCESS_KEY) that we remember in localStorage so you only type it once.
// The whole GoatCounter free plan surfaces here: totals, top pages, referrers,
// countries, browsers, systems and screen sizes — with a 7d / 30d / all switch.
// ─────────────────────────────────────────────────────────────────────────────

type Row = { name: string; id?: string; count: number };
type Page = { path: string; title: string; count: number };
type Stats = {
  enabled: boolean;
  range?: string;
  total?: number;
  events?: number;
  pages?: Page[];
  referrers?: Row[];
  browsers?: Row[];
  systems?: Row[];
  locations?: Row[];
  sizes?: Row[];
  error?: string;
};

type RangeKey = "7d" | "30d" | "all";
const LS_KEY = "nk_stats_key";

const T = {
  en: {
    title: "Analytics",
    sub: "Live traffic from GoatCounter",
    passPrompt: "Enter the access password",
    passBtn: "View stats",
    wrongPass: "Wrong password.",
    loading: "Loading…",
    ranges: { "7d": "7 days", "30d": "30 days", all: "All time" } as Record<RangeKey, string>,
    pageviews: "Pageviews",
    events: "Events",
    countries: "Countries",
    topPages: "Top pages",
    referrers: "Referrers",
    browsers: "Browsers",
    systems: "Systems",
    sizes: "Screen sizes",
    noData: "No data yet.",
    setup: "Analytics isn't wired up yet. Set GOATCOUNTER_API_TOKEN (and STATS_ACCESS_KEY) in the environment.",
    logout: "Lock",
    direct: "(direct / none)",
  },
  es: {
    title: "Analytics",
    sub: "Tráfico en vivo desde GoatCounter",
    passPrompt: "Ingresá la contraseña de acceso",
    passBtn: "Ver stats",
    wrongPass: "Contraseña incorrecta.",
    loading: "Cargando…",
    ranges: { "7d": "7 días", "30d": "30 días", all: "Todo" } as Record<RangeKey, string>,
    pageviews: "Vistas",
    events: "Eventos",
    countries: "Países",
    topPages: "Páginas top",
    referrers: "Referrers",
    browsers: "Navegadores",
    systems: "Sistemas",
    sizes: "Tamaños de pantalla",
    noData: "Sin datos todavía.",
    setup: "Analytics todavía no está cableado. Definí GOATCOUNTER_API_TOKEN (y STATS_ACCESS_KEY) en el entorno.",
    logout: "Bloquear",
    direct: "(directo / ninguno)",
  },
};

// Country code (e.g. "AR") → flag emoji via regional-indicator symbols.
function flag(cc?: string): string {
  if (!cc || !/^[A-Za-z]{2}$/.test(cc)) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    ...cc.toUpperCase().split("").map((c) => base + c.charCodeAt(0) - 65),
  );
}

export default function StatsDashboard() {
  const { lang } = useLang();
  const t = T[lang];

  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [range, setRange] = useState<RangeKey>("all");
  const [data, setData] = useState<Stats | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "unauth" | "error">("idle");

  // Restore a saved password on mount, then mark ready. Doing the load only once
  // `ready` is set (below) means there's a SINGLE load path — no null-key probe
  // racing the real load and clobbering good data with the password gate.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved) setKey(saved);
    setReady(true);
  }, []);

  const load = useCallback(
    async (k: string | null, r: RangeKey) => {
      setState("loading");
      try {
        const params = new URLSearchParams({ range: r });
        if (k) params.set("key", k);
        const res = await fetch(`/api/stats?${params.toString()}`, { cache: "no-store" });
        if (res.status === 401) {
          // A stored key that no longer works: drop it so a refresh doesn't keep
          // re-sending a bad password.
          if (k && typeof window !== "undefined") localStorage.removeItem(LS_KEY);
          setState("unauth");
          setData(null);
          return;
        }
        const json: Stats = await res.json();
        setData(json);
        setState(json.error ? "error" : "idle");
      } catch {
        setState("error");
      }
    },
    [],
  );

  // Single load path: once the saved key is resolved, fetch with it (or null).
  // Also refires when the range switches or the user submits a password.
  useEffect(() => {
    if (ready) load(key, range);
  }, [ready, key, range, load]);

  function submitKey(e: React.FormEvent) {
    e.preventDefault();
    const k = input.trim();
    if (!k) return;
    localStorage.setItem(LS_KEY, k);
    setKey(k);
  }

  function lock() {
    localStorage.removeItem(LS_KEY);
    setKey(null);
    setData(null);
    setState("unauth");
  }

  // ── Password gate ──────────────────────────────────────────────────────────
  if (state === "unauth") {
    return (
      <Shell t={t}>
        <form onSubmit={submitKey} className="mt-10 max-w-sm space-y-3">
          <label className="block text-xs uppercase tracking-widest text-ash">{t.passPrompt}</label>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className="w-full bg-coal border border-white/10 px-3 py-2 font-mono text-sm text-bone focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-accent-soft"
          >
            {t.passBtn}
          </button>
          {data === null && key !== null && <p className="text-xs text-accent">{t.wrongPass}</p>}
        </form>
      </Shell>
    );
  }

  if (state === "loading" && !data) {
    return (
      <Shell t={t}>
        <p className="mt-10 font-mono text-sm text-ash">{t.loading}</p>
      </Shell>
    );
  }

  if (data && data.enabled === false) {
    return (
      <Shell t={t}>
        <p className="mt-10 max-w-lg font-mono text-sm text-ash">{t.setup}</p>
      </Shell>
    );
  }

  if (state === "error") {
    return (
      <Shell t={t}>
        <p className="mt-10 font-mono text-sm text-accent">Error: {data?.error ?? "request failed"}</p>
      </Shell>
    );
  }

  const nf = new Intl.NumberFormat(lang === "es" ? "es-AR" : "en-US");
  const locations = (data?.locations ?? []).map((l) => ({ ...l, name: `${flag(l.id)} ${l.name}`.trim() }));
  const referrers = (data?.referrers ?? []).map((r) => ({ ...r, name: r.name || t.direct }));

  return (
    <Shell t={t} onLock={key ? lock : undefined}>
      {/* Range switch */}
      <div className="mt-6 inline-flex gap-1 border border-white/10 p-1">
        {(["7d", "30d", "all"] as RangeKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 text-xs font-mono transition-colors ${
              range === r ? "bg-accent text-void" : "text-ash hover:text-bone"
            }`}
          >
            {t.ranges[r]}
          </button>
        ))}
      </div>

      {/* Headline totals */}
      <div className="mt-8 flex flex-wrap gap-10">
        <Big label={t.pageviews} value={nf.format(data?.total ?? 0)} />
        {(data?.events ?? 0) > 0 && <Big label={t.events} value={nf.format(data?.events ?? 0)} />}
      </div>

      {/* Breakdown grid */}
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <BarList title={t.topPages} rows={(data?.pages ?? []).map((p) => ({ name: p.title || p.path, sub: p.path, count: p.count }))} nf={nf} empty={t.noData} />
        <BarList title={t.referrers} rows={referrers.map((r) => ({ name: r.name, count: r.count }))} nf={nf} empty={t.noData} />
        <BarList title={t.countries} rows={locations.map((l) => ({ name: l.name, count: l.count }))} nf={nf} empty={t.noData} />
        <BarList title={t.browsers} rows={(data?.browsers ?? []).map((b) => ({ name: b.name, count: b.count }))} nf={nf} empty={t.noData} />
        <BarList title={t.systems} rows={(data?.systems ?? []).map((s) => ({ name: s.name, count: s.count }))} nf={nf} empty={t.noData} />
        <BarList title={t.sizes} rows={(data?.sizes ?? []).map((s) => ({ name: s.name, count: s.count }))} nf={nf} empty={t.noData} />
      </div>
    </Shell>
  );
}

// ── Layout shell ─────────────────────────────────────────────────────────────
function Shell({
  t,
  onLock,
  children,
}: {
  t: (typeof T)["en"];
  onLock?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-graffiti text-5xl text-bone">{t.title}</h1>
          <p className="mt-1 text-sm text-ash">{t.sub}</p>
        </div>
        {onLock && (
          <button onClick={onLock} className="text-xs uppercase tracking-widest text-ash hover:text-accent">
            {t.logout}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-5xl font-bold text-bone tabular-nums">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-ash">{label}</div>
    </div>
  );
}

// ── Horizontal bar list ──────────────────────────────────────────────────────
function BarList({
  title,
  rows,
  nf,
  empty,
}: {
  title: string;
  rows: { name: string; sub?: string; count: number }[];
  nf: Intl.NumberFormat;
  empty: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ash">{title}</h2>
      {rows.length === 0 ? (
        <p className="font-mono text-xs text-ash/60">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={i} className="relative">
              <div
                className="absolute inset-y-0 left-0 bg-accent/15"
                style={{ width: `${(r.count / max) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-3 px-2 py-1">
                <span className="truncate text-sm text-bone" title={r.sub || r.name}>
                  {r.name}
                </span>
                <span className="shrink-0 font-mono text-xs text-ash tabular-nums">{nf.format(r.count)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
