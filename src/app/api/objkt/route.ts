import { NextRequest, NextResponse } from "next/server";
import { fetchCreatorBundle, isDisplayableToken } from "@/lib/objkt";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const alias = url.searchParams.get("alias");
  const limit = Number(url.searchParams.get("limit") ?? 300);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  if (!alias) {
    return NextResponse.json(
      { error: "missing alias param" },
      { status: 400 },
    );
  }

  const { address, holder, tokens } = await fetchCreatorBundle(alias, {
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
}
