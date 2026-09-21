import { NextRequest, NextResponse } from "next/server";
import { fetchStats, hasToken, isStatsRange } from "@/lib/goatcounter";

// ─────────────────────────────────────────────────────────────────────────────
// Private analytics proxy for the GoatCounter dashboard (/stats page). Returns
// the FULL data (top pages, referrers, countries, browsers, systems, sizes) and
// is gated by STATS_ACCESS_KEY — a password only the owner knows. The public
// subset (total + countries) lives at /api/stats/public with no auth.
// The GoatCounter token itself lives in @/lib/goatcounter, server-side only.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const ACCESS_KEY = process.env.STATS_ACCESS_KEY;

export async function GET(req: NextRequest) {
  // Fail closed: missing configuration must never expose private analytics.
  if (!ACCESS_KEY) {
    return NextResponse.json({ enabled: false }, { headers: { "cache-control": "private, no-store" } });
  }
  const key = req.headers.get("x-stats-key");
  if (key !== ACCESS_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "cache-control": "private, no-store" } });
  }

  // Token not set yet → tell the UI so it can show setup instructions.
  if (!hasToken()) return NextResponse.json({ enabled: false }, { headers: { "cache-control": "private, no-store" } });

  const range = req.nextUrl.searchParams.get("range") || "all";
  if (!isStatsRange(range)) return NextResponse.json({ error: "invalid range" }, { status: 400 });
  try {
    const data = await fetchStats(range);
    return NextResponse.json(data, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return NextResponse.json({ enabled: true, error: "Statistics temporarily unavailable" }, { status: 502, headers: { "cache-control": "private, no-store" } });
  }
}
