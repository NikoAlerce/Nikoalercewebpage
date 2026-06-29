import { NextRequest, NextResponse } from "next/server";

// Server-side IPFS proxy. WebGL textures (canvas / VideoTexture) require CORS, but
// many public IPFS gateways don't send CORS headers or rate-limit hard. We fetch the
// content server-side (no CORS there) and re-serve it from our own origin with
// `access-control-allow-origin: *`, so the browser loads it same-origin and can use
// it in a canvas / WebGL without tainting.
//
// IMPORTANT for video: we forward the browser's `Range` header to the gateway and pass
// the gateway's `206 Partial Content` + `Content-Range` / `Accept-Ranges` back through.
// Without this, a <video> can't stream/seek progressively and has to buffer the whole
// mp4 before playback starts.
//
// SPEED: public gateways have wildly variable latency (ipfs.io is often rate-limited /
// slow). Instead of trying them one by one, the FIRST request for a CID *races* a few
// gateways in parallel and uses whichever answers first; the winner is pinned per-CID so
// the many follow-up Range requests of a streaming video go straight to the fast one.

const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://4everland.io/ipfs/",
];

// How many gateways to race in parallel on a cold CID.
const RACE_COUNT = 3;
// Don't let a single slow/dead gateway hang the whole request.
const GATEWAY_TIMEOUT_MS = 8000;

// Remember the fastest gateway per CID so streaming Range requests skip the race.
const fastestGateway = new Map<string, string>();
const FASTEST_CACHE_CAP = 500;

function rememberFastest(cid: string, gw: string) {
  if (fastestGateway.size > FASTEST_CACHE_CAP) fastestGateway.clear();
  fastestGateway.set(cid, gw);
}

// Resolved direct URLs (after following any gateway redirect) per CID — used by the video
// redirect path so the browser is sent straight to the final, CORS-enabled, Range-serving
// URL. Best-effort: this Map is per-lambda-instance and may be cold, in which case we probe.
const resolvedVideoUrl = new Map<string, string>();
// Gateways that serve content (and CORS + Range) directly, preferred for the video redirect.
const VIDEO_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://4everland.io/ipfs/",
];
const PROBE_TIMEOUT_MS = 5000;

// Probe a gateway with a tiny Range request; resolves to the FINAL url (after redirects)
// if it can serve the bytes. We only need the headers, so we cancel the body immediately.
async function probeGateway(gw: string, cid: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(gw + cid, {
    method: "GET",
    redirect: "follow",
    headers: { range: "bytes=0-1", accept: "video/*,*/*" },
    signal,
  });
  if (!res.ok) throw new Error(`probe ${gw} -> ${res.status}`);
  try { await res.body?.cancel(); } catch { /* ignore */ }
  return res.url || gw + cid; // res.url is the resolved (post-redirect) location
}

// Pick a fast, working, CORS-enabled direct URL for this CID (pinned if known, else race).
async function pickVideoUrl(cid: string): Promise<string | null> {
  const pinned = resolvedVideoUrl.get(cid);
  if (pinned) return pinned;
  const racers = VIDEO_GATEWAYS.slice(0, RACE_COUNT);
  const controllers = racers.map(() => new AbortController());
  const timers = controllers.map((c) => setTimeout(() => c.abort(), PROBE_TIMEOUT_MS));
  try {
    const url = await Promise.any(racers.map((g, i) => probeGateway(g, cid, controllers[i].signal)));
    timers.forEach(clearTimeout);
    controllers.forEach((c) => c.abort());
    if (resolvedVideoUrl.size > FASTEST_CACHE_CAP) resolvedVideoUrl.clear();
    resolvedVideoUrl.set(cid, url);
    return url;
  } catch {
    timers.forEach(clearTimeout);
    controllers.forEach((c) => c.abort());
    return null;
  }
}

function buildHeaders(range: string | null): Record<string, string> {
  const h: Record<string, string> = { accept: "image/*,video/*,*/*" };
  if (range) h.range = range;
  return h;
}

async function tryGateway(
  gw: string,
  cid: string,
  range: string | null,
  signal: AbortSignal,
): Promise<{ res: Response; gw: string }> {
  const res = await fetch(gw + cid, { redirect: "follow", headers: buildHeaders(range), signal });
  if (!res.ok || !res.body) throw new Error(`gateway ${gw} -> ${res.status}`);
  return { res, gw };
}

function relay(upstream: Response): Response {
  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "accept-ranges": "bytes",
    // IPFS content is content-addressed → the bytes for a CID never change, so cache hard
    // and immutably. On Vercel this fills the edge cache: the 2nd viewer of any artwork
    // (and every repeat load) gets it instantly without re-hitting a gateway.
    "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
  };
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  if (contentLength) headers["content-length"] = contentLength;
  if (contentRange) headers["content-range"] = contentRange;
  return new Response(upstream.body, { status: upstream.status, headers });
}

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

  const range = req.headers.get("range");

  // 0) Video redirect path: send the <video> straight to a CORS-enabled gateway so the
  // bytes never stream through this serverless function. Removes the double-hop + the
  // per-invocation gateway re-racing that makes heavy video crawl on Vercel.
  if (req.nextUrl.searchParams.get("redirect") === "1") {
    const target = await pickVideoUrl(cid);
    if (target) {
      return new Response(null, {
        status: 307,
        headers: {
          location: target,
          "access-control-allow-origin": "*",
          // Let the browser cache the redirect so repeat Range requests skip the lambda.
          "cache-control": "public, max-age=86400",
        },
      });
    }
    // No gateway answered the probe → fall through and proxy the bytes as a last resort.
  }

  // 1) Pinned fastest gateway for this CID (set by an earlier request) — go straight there.
  const pinned = fastestGateway.get(cid);
  if (pinned) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), GATEWAY_TIMEOUT_MS);
    try {
      const { res } = await tryGateway(pinned, cid, range, ctrl.signal);
      clearTimeout(timer);
      return relay(res);
    } catch {
      clearTimeout(timer);
      fastestGateway.delete(cid); // it went bad — fall through to a fresh race
    }
  }

  // 2) Cold CID: race the first few gateways, use + pin the fastest responder.
  const racers = GATEWAYS.slice(0, RACE_COUNT);
  const controllers = racers.map(() => new AbortController());
  const timers = controllers.map((c) => setTimeout(() => c.abort(), GATEWAY_TIMEOUT_MS));
  try {
    const { res, gw } = await Promise.any(
      racers.map((g, i) => tryGateway(g, cid, range, controllers[i].signal)),
    );
    timers.forEach(clearTimeout);
    // Abort the losers so their connections/streams are freed.
    controllers.forEach((c, i) => { if (racers[i] !== gw) c.abort(); });
    rememberFastest(cid, gw);
    return relay(res);
  } catch {
    timers.forEach(clearTimeout);
    controllers.forEach((c) => c.abort());
  }

  // 3) Fallback: sequentially try any gateways not in the race.
  for (const gw of GATEWAYS.slice(RACE_COUNT)) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), GATEWAY_TIMEOUT_MS);
    try {
      const { res } = await tryGateway(gw, cid, range, ctrl.signal);
      clearTimeout(timer);
      rememberFastest(cid, gw);
      return relay(res);
    } catch {
      clearTimeout(timer);
    }
  }

  return NextResponse.json({ error: "all gateways failed", cid }, { status: 502 });
}
