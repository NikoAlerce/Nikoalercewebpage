// Maps an NFT's IPFS artifact to a locally-hosted, pre-transcoded mp4 (built by
// scripts/optimize-nft-gifs.mjs). The collection's animated GIFs are 14–40MB each, which is
// brutal to download + decode in the 3D gallery; the mp4 versions are ~1–4MB and play as a
// cheap VideoTexture. If a CID isn't in the manifest we fall back to the original pipeline.
import manifest from "./optimizedManifest.json";

const OPTIMIZED = new Set<string>(manifest as string[]);

export function cidFromUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) return uri.slice("ipfs://".length);
  return uri.match(/\/ipfs\/([^?#]+)/)?.[1] ?? uri;
}

// Mirror of scripts/optimize-nft-gifs.mjs safeName — keep them in sync.
function safeName(cid: string): string {
  return cid.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Local mp4 URL for this artifact if we pre-transcoded it, else null. */
export function optimizedVideoUrl(uri?: string | null): string | null {
  const cid = cidFromUri(uri);
  return cid && OPTIMIZED.has(cid) ? `/nft-opt/${safeName(cid)}.mp4` : null;
}
