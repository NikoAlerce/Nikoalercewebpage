import { NextRequest, NextResponse } from "next/server";

// Server-side IPFS proxy. WebGL textures (canvas / VideoTexture) require CORS, but
// many public IPFS gateways don't send CORS headers or rate-limit hard. We fetch the
// content server-side (no CORS there) and re-serve it from our own origin with
// `access-control-allow-origin: *`, so the browser loads it same-origin and can use
// it in a canvas / WebGL without tainting.

const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
];

export async function GET(req: NextRequest) {
  const uri = req.nextUrl.searchParams.get("uri");
  if (!uri) {
    return NextResponse.json({ error: "missing uri" }, { status: 400 });
  }

  // Already an http(s) URL? pass the CID through our gateways anyway when possible.
  const cid = uri.startsWith("ipfs://")
    ? uri.slice("ipfs://".length)
    : uri.startsWith("http")
      ? uri.replace(/^https?:\/\/[^/]+\/ipfs\//, "")
      : uri;

  for (const gw of GATEWAYS) {
    try {
      const upstream = await fetch(gw + cid, {
        // follow redirects, cache at the edge
        redirect: "follow",
        headers: { accept: "image/*,video/*,*/*" },
      });
      if (!upstream.ok || !upstream.body) continue;

      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "content-type": contentType,
          "access-control-allow-origin": "*",
          "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      // try the next gateway
    }
  }

  return NextResponse.json({ error: "all gateways failed", cid }, { status: 502 });
}
