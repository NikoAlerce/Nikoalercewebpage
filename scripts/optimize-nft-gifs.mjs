// Transcode the collection's heavy animated GIFs (14–40MB each) into tiny looping mp4s so
// the 3D gallery can play them as cheap VideoTextures instead of decoding giant GIFs.
//
//   node scripts/optimize-nft-gifs.mjs [limit]
//
// Downloads each gif's artifact from a public IPFS gateway, runs ffmpeg → H.264 mp4
// (no audio, capped width, even dims, faststart), writes them to public/nft-opt/<cid>.mp4
// and records the successful CIDs in src/lib/optimizedManifest.json. Re-running skips files
// already produced, so it's resumable. Requires the dev server running on :3000 for the
// token list (same source the gallery uses).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "nft-opt");
const MANIFEST = path.join(ROOT, "src", "lib", "optimizedManifest.json");
const TOKENS_URL = "http://localhost:3000/api/objkt?alias=sidequest&limit=300";
const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://dweb.link/ipfs/",
  "https://4everland.io/ipfs/",
];
const MAX_W = 640;          // cap width; gallery frames are small
const LIMIT = Number(process.argv[2]) || Infinity;

const cidOf = (uri) =>
  !uri ? null
  : uri.startsWith("ipfs://") ? uri.slice(7)
  : (uri.match(/\/ipfs\/([^?#]+)/)?.[1] ?? uri);
const safeName = (cid) => cid.replace(/[^a-zA-Z0-9._-]/g, "_");

async function getTokens() {
  const r = await fetch(TOKENS_URL);
  if (!r.ok) throw new Error(`token list ${r.status} — is the dev server running on :3000?`);
  return (await r.json()).tokens ?? [];
}

async function download(cid, dest) {
  for (const gw of GATEWAYS) {
    try {
      const res = await fetch(gw + cid, { signal: AbortSignal.timeout(90000) });
      if (!res.ok) continue;
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return fs.statSync(dest).size;
    } catch { /* try next gateway */ }
  }
  return 0;
}

function transcode(src, out) {
  execFileSync("ffmpeg", [
    "-y", "-i", src,
    "-an",
    // cap width to MAX_W (never upscale), force even W/H for H.264, then yuv420p.
    "-vf", `scale='min(${MAX_W}\\,iw)':-2,crop=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`,
    "-c:v", "libx264", "-crf", "26", "-preset", "veryfast",
    "-movflags", "+faststart",
    out,
  ], { stdio: "ignore" });
}

const tokens = await getTokens();
const gifs = tokens.filter((t) => t.mime === "image/gif").slice(0, LIMIT);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });

const done = [];
const tmp = os.tmpdir();
let savedIn = 0, savedOut = 0;

for (let i = 0; i < gifs.length; i++) {
  const t = gifs[i];
  const cid = cidOf(t.artifact_uri);
  if (!cid) continue;
  const name = safeName(cid);
  const out = path.join(OUT_DIR, name + ".mp4");
  const tag = `[${i + 1}/${gifs.length}]`;

  if (fs.existsSync(out) && fs.statSync(out).size > 0) {
    console.log(`${tag} skip (exists) ${cid}`);
    done.push(cid);
    continue;
  }

  const srcFile = path.join(tmp, name + ".gif");
  const inSz = await download(cid, srcFile);
  if (!inSz) { console.log(`${tag} FAIL download ${cid}`); continue; }

  try {
    transcode(srcFile, out);
    const outSz = fs.statSync(out).size;
    savedIn += inSz; savedOut += outSz;
    console.log(`${tag} OK  ${(inSz / 1048576).toFixed(1)}MB -> ${(outSz / 1048576).toFixed(2)}MB  ${t.name?.slice(0, 40) ?? ""}`);
    done.push(cid);
  } catch {
    console.log(`${tag} FAIL ffmpeg ${cid}`);
    try { fs.unlinkSync(out); } catch {}
  } finally {
    try { fs.unlinkSync(srcFile); } catch {}
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(done));
console.log(`\nDONE: ${done.length}/${gifs.length} optimized`);
if (savedOut) console.log(`Transcoded batch: ${(savedIn / 1048576).toFixed(0)}MB -> ${(savedOut / 1048576).toFixed(1)}MB`);
console.log(`Manifest: ${MANIFEST}`);
