// ─────────────────────────────────────────────────────────────────────────────
// Shared GoatCounter data layer, used by both API routes:
//   /api/stats         → full private dashboard (password-gated)
//   /api/stats/public  → public subset (total + countries), no auth
//
// The secret API token lives here, server-side only — it must NEVER reach the
// browser. One coherent snapshot per range is cached in-process (5 min), so all
// widgets stay in sync and we stay well under GoatCounter's 4 req/s limit
// regardless of which route is asking.
//
// Required env (see .env.example):
//   GOATCOUNTER_API_TOKEN  — API token from [Username] → API in GoatCounter
//   GOATCOUNTER_SITE       — optional, defaults to the known site URL
// ─────────────────────────────────────────────────────────────────────────────

const SITE = process.env.GOATCOUNTER_SITE || "https://nikoalerce.goatcounter.com";
const TOKEN = process.env.GOATCOUNTER_API_TOKEN;

// GoatCounter's stats default to "last week"; passing a far-back start makes the
// "all" range effectively all-time (it clamps to whatever data exists).
const SINCE = "2020-01-01T00:00:00Z";

export type Range = "7d" | "30d" | "all";
export type Row = { name: string; id?: string; count: number };
export type Page = { path: string; title: string; count: number };

export type Stats = {
  enabled: true;
  range: string;
  total: number;
  pages: Page[];
  referrers: Row[];
  browsers: Row[];
  systems: Row[];
  locations: Row[];
  sizes: Row[];
};

export function hasToken(): boolean {
  return !!TOKEN;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// GoatCounter's limit is 4 req/s. We space calls out (below) to stay under it,
// but also retry on 429 with backoff so a transient burst never breaks the page.
async function gc<T>(path: string, attempt = 0): Promise<T> {
  const res = await fetch(`${SITE}/api/v0${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    cache: "no-store", // freshness is handled by our own snapshot cache below
  });
  if (res.status === 429 && attempt < 3) {
    const reset = Number(res.headers.get("x-rate-limit-reset")) || 1;
    await sleep(Math.min(reset, 3) * 1000 + 250);
    return gc<T>(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

const SIZE_LABELS: Record<string, string> = {
  phone: "Phone",
  largephone: "Large phone",
  tablet: "Tablet",
  desktop: "Desktop",
  largescreen: "Large screen",
};

// One coherent snapshot per range, cached in-process for a few minutes. Keeps
// every widget in sync (same instant) and spares GoatCounter's rate limit —
// shared across both routes so at most one burst of calls per range per 5 min.
const snapshots = new Map<string, { at: number; data: Stats }>();
const SNAPSHOT_TTL = 5 * 60_000; // 5 minutes

export async function fetchStats(range: string): Promise<Stats> {
  const cached = snapshots.get(range);
  if (cached && Date.now() - cached.at < SNAPSHOT_TTL) return cached.data;

  const start = range === "7d" ? isoDaysAgo(7) : range === "30d" ? isoDaysAgo(30) : SINCE;
  const q = `start=${encodeURIComponent(start)}`;

  // ~300ms between calls keeps us at ~3 req/s, comfortably under the 4/s cap.
  // Note: /stats/total 404s on this GoatCounter version — but /stats/hits already
  // returns the grand `total` alongside the per-page list, so we read the headline
  // number from there and skip the extra (broken) call.
  const gap = () => sleep(300);
  const hits = await gc<{ hits?: Page[]; total?: number }>(`/stats/hits?${q}&limit=15`);
  await gap();
  const refs = await gc<{ stats?: Row[] }>(`/stats/toprefs?${q}&limit=12`);
  await gap();
  const browsers = await gc<{ stats?: Row[] }>(`/stats/browsers?${q}&limit=8`);
  await gap();
  const systems = await gc<{ stats?: Row[] }>(`/stats/systems?${q}&limit=8`);
  await gap();
  const locations = await gc<{ stats?: Row[] }>(`/stats/locations?${q}&limit=12`);
  await gap();
  const sizes = await gc<{ stats?: Row[] }>(`/stats/sizes?${q}&limit=6`);

  const rows = (r?: Row[]): Row[] => (r ?? []).map((s) => ({ name: s.name, id: s.id, count: s.count }));
  const sizeRows = (r?: Row[]): Row[] =>
    (r ?? []).map((s) => ({ name: s.name || SIZE_LABELS[s.id ?? ""] || "Unknown", id: s.id, count: s.count }));

  const data: Stats = {
    enabled: true,
    range,
    total: hits.total ?? 0,
    pages: (hits.hits ?? []).map((h) => ({ path: h.path, title: h.title, count: h.count })),
    referrers: rows(refs.stats),
    browsers: rows(browsers.stats),
    systems: rows(systems.stats),
    locations: rows(locations.stats),
    sizes: sizeRows(sizes.stats),
  };

  snapshots.set(range, { at: Date.now(), data });
  return data;
}
