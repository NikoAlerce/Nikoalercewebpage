import { NextRequest, NextResponse } from "next/server";
import { fetchTokensByIds } from "@/lib/objkt";

export const revalidate = 300;

// GET /api/tokens?ids=KT1abc:353,KT1def:2,KT1def:0
// Returns the requested tokens (by contract:token_id) in arbitrary order.
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({ tokens: [] });
  if (ids.split(",").length > 100) {
    return NextResponse.json({ error: "too many token ids" }, { status: 400 });
  }

  const pairs = ids
    .split(",")
    .map((s) => {
      const i = s.lastIndexOf(":");
      if (i < 0) return null;
      return { contract: s.slice(0, i), id: s.slice(i + 1) };
    })
    .filter((p): p is { contract: string; id: string } => !!p && !!p.contract && !!p.id);

  if (pairs.length !== ids.split(",").length || pairs.some((p) => !/^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(p.contract) || !/^\d+$/.test(p.id))) {
    return NextResponse.json({ error: "invalid token ids" }, { status: 400 });
  }
  try {
    const tokens = await fetchTokensByIds(pairs);
    return NextResponse.json(
      { tokens },
      { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=900" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Objkt is temporarily unavailable. Please retry." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
