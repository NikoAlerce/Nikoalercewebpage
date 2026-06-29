import { NextRequest, NextResponse } from "next/server";
import { fetchTokensByIds } from "@/lib/objkt";

export const revalidate = 300;

// GET /api/tokens?ids=KT1abc:353,KT1def:2,KT1def:0
// Returns the requested tokens (by contract:token_id) in arbitrary order.
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({ tokens: [] });

  const pairs = ids
    .split(",")
    .map((s) => {
      const i = s.lastIndexOf(":");
      if (i < 0) return null;
      return { contract: s.slice(0, i), id: s.slice(i + 1) };
    })
    .filter((p): p is { contract: string; id: string } => !!p && !!p.contract && !!p.id);

  const tokens = await fetchTokensByIds(pairs);
  return NextResponse.json(
    { tokens },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=900" } },
  );
}
