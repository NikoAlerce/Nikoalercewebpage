import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Private analytics proxy for the GoatCounter dashboard (/stats page).
//
// Why a serverless route at all (the footer counter is pure client-side): the
// rich stats — top pages, referrers, countries, browsers… — need the GoatCounter
// API, which requires a secret Bearer token. That token must NEVER reach the
// browser, so this route holds it server-side and returns only the shaped data.
//
// It's gated by STATS_ACCESS_KEY (a password only you know) and cached for an
// hour, so it's cheap: at most one burst of API calls per hour regardless of how
// often you open the dashboard. GoatCounter's own limit is 4 req/s, so we call
// its endpoints SEQUENTIALLY rather than in parallel to stay well under it.
//
// Required env (see .env.example):
//   GOATCOUNTER_API_TOKEN  — API token from [Username] → API in GoatCounter
//   STATS_ACCESS_KEY       — password to view /stats (kept out of the client)
//   GOATCOUNTER_SITE       — optional, defaults to the known site URL
// ─────────────────────────────────────────────────────────────────────────────

// Rendered dynamically (reads a query param) — we do our OWN caching below so
// that all six GoatCounter calls are cached together as one coherent snapshot,
// rather than each fetch caching on its own clock (which let the header show an
// old total while the breakdowns showed a newer one).
export const dynamic = "force-dynamic";

const SITE = process.env.GOATCOUNTER_SITE || "https://nikoalerce.goatcounter.com";
const TOKEN = process.env.GOATCOUNTER_API_TOKEN;
const ACCESS_KEY = process.env.STATS_ACCESS_KEY;

// GoatCounter's stats default to "last week"; passing a far-back start makes the
// "all" range effectively all-time (it clamps to whatever data exists).
const SINCE = "2020-01-01T00:00:00Z";

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

type Row = { name: string; id?: string; count: number };

// One coherent snapshot per range, cached in-process for a few minutes. Keeps
// all six widgets in sync (same instant) and spares GoatCounter's rate limit.
const snapshots = new Map<string, { at: number; body: unknown }>();
const SNAPSHOT_TTL = 5 * 60_000; // 5 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// GoatCounter's limit is 4 req/s. We space calls out (below) to stay under it,
// but also retry on 429 with backoff so a transient burst never breaks the page.
async function gc<T>(path: string, attempt = 0): Promise<T> {
  const res = await fetch(`${SITE}/api/v0${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    cache: "no-store", // freshness is handled by our own snapshot cache (see GET)
  });
  if (res.status === 429 && attempt < 3) {
    const reset = Number(res.headers.get("x-rate-limit-reset")) || 1;
    await sleep(Math.min(reset, 3) * 1000 + 250);
    return gc<T>(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function GET(req: NextRequest) {
  // ── Gate: if a password is configured, demand it (query ?key= or header). ──
  if (ACCESS_KEY) {
    const key = req.nextUrl.searchParams.get("key") || req.headers.get("x-stats-key");
    if (key !== ACCESS_KEY) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Token not set yet → tell the UI so it can show setup instructions instead of
  // a broken/blank dashboard.
  if (!TOKEN) return NextResponse.json({ enabled: false });

  const range = req.nextUrl.searchParams.get("range") || "all";

  // Serve a recent coherent snapshot if we have one (all six widgets in sync).
  const cached = snapshots.get(range);
  if (cached && Date.now() - cached.at < SNAPSHOT_TTL) {
    return NextResponse.json(cached.body, { headers: { "cache-control": "private, no-store" } });
  }

  const start = range === "7d" ? isoDaysAgo(7) : range === "30d" ? isoDaysAgo(30) : SINCE;
  const q = `start=${encodeURIComponent(start)}`;

  try {
    // Sequential on purpose — stays under GoatCounter's 4 req/s limit. Cached for
    // an hour, so the added latency is paid at most once per hour.
    // Note: /stats/total 404s on this GoatCounter version — but /stats/hits
    // already returns the grand `total` alongside the per-page list, so we read
    // the headline number from there and skip the extra (broken) call.
    // ~300ms between calls keeps us at ~3 req/s, comfortably under the 4/s cap.
    const gap = () => sleep(300);
    const hits = await gc<{ hits?: { path: string; title: string; count: number }[]; total?: number }>(`/stats/hits?${q}&limit=15`);
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

    const rows = (r?: Row[]) => (r ?? []).map((s) => ({ name: s.name, id: s.id, count: s.count }));

    // GoatCounter returns screen sizes with an empty name and the bucket in `id`
    // (phone / tablet / desktop…) — give them a readable label.
    const SIZE_LABELS: Record<string, string> = {
      phone: "Phone",
      largephone: "Large phone",
      tablet: "Tablet",
      desktop: "Desktop",
      largescreen: "Large screen",
    };
    const sizeRows = (r?: Row[]) =>
      (r ?? []).map((s) => ({ name: s.name || SIZE_LABELS[s.id ?? ""] || "Unknown", id: s.id, count: s.count }));

    const body = {
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

    snapshots.set(range, { at: Date.now(), body });
    return NextResponse.json(body, { headers: { "cache-control": "private, no-store" } });
  } catch (e) {
    return NextResponse.json({ enabled: true, error: String(e) }, { status: 502 });
  }
}
