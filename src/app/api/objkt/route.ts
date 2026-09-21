import { NextRequest, NextResponse } from "next/server";
import { fetchCreatorBundle, isDisplayableToken } from "@/lib/objkt";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const alias = url.searchParams.get("alias");
  const limit = Number(url.searchParams.get("limit") ?? 300);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  if (!alias?.trim() || alias.length > 100 || !Number.isSafeInteger(limit) || limit < 1 || limit > 300 || !Number.isSafeInteger(offset) || offset < 0) {
    return NextResponse.json(
      { error: "invalid alias, limit or offset" },
      { status: 400 },
    );
  }

  try {
    const { address, holder, tokens } = await fetchCreatorBundle(alias.trim(), {
      limit,
      offset,
    });
    const liveTokens = tokens.filter(isDisplayableToken);

    return NextResponse.json(
      { alias, address, holder, tokens: liveTokens },
      {
        headers: {
          "cache-control":
            "public, s-maxage=300, stale-while-revalidate=900",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Objkt is temporarily unavailable. Please retry." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
