import { NextRequest, NextResponse } from "next/server";
import { fetchStats, hasToken } from "@/lib/goatcounter";

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
  // ── Gate: if a password is configured, demand it (query ?key= or header). ──
  if (ACCESS_KEY) {
    const key = req.nextUrl.searchParams.get("key") || req.headers.get("x-stats-key");
    if (key !== ACCESS_KEY) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Token not set yet → tell the UI so it can show setup instructions.
  if (!hasToken()) return NextResponse.json({ enabled: false });

  const range = req.nextUrl.searchParams.get("range") || "all";
  try {
    const data = await fetchStats(range);
    return NextResponse.json(data, { headers: { "cache-control": "private, no-store" } });
  } catch (e) {
    return NextResponse.json({ enabled: true, error: String(e) }, { status: 502 });
  }
}
