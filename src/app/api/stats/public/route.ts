import { NextRequest, NextResponse } from "next/server";
import { fetchStats, hasToken } from "@/lib/goatcounter";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC analytics — no auth. Deliberately exposes only a harmless subset:
//   total    → number of visits (for the "X visitas" footer counter)
//   countries → where visitors come from
// It NEVER returns referrers, pages, browsers, etc. — those stay behind the
// password at /api/stats. Uses the same shared snapshot cache, so opening the
// site doesn't add load beyond one refresh per 5 minutes.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!hasToken()) return NextResponse.json({ enabled: false });

  const range = req.nextUrl.searchParams.get("range") || "all";
  try {
    const data = await fetchStats(range);
    return NextResponse.json(
      { enabled: true, range, total: data.total, countries: data.locations },
      // Cacheable at the edge/CDN too — it's public and only changes slowly.
      { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=900" } },
    );
  } catch (e) {
    return NextResponse.json({ enabled: false, error: String(e) }, { status: 502 });
  }
}
