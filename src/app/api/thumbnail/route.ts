import sharp from "sharp";
import { ipfsPath, objktCdnUrl } from "@/lib/objkt";

export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_BYTES = 32 * 1024 * 1024;

async function readImage(response: Response): Promise<Buffer> {
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    await response.body?.cancel();
    throw new Error("Invalid image response");
  }
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    await response.body?.cancel();
    throw new Error("Image too large");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty response");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error("Image too large");
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally { await reader.cancel(); }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = ipfsPath(url.searchParams.get("uri"));
  if (!path) return Response.json({ error: "Invalid IPFS image" }, { status: 400 });
  const transient = url.searchParams.get("source") === "transient";
  const transientImage = `https://ipfs.transientusercontent.xyz/ipfs/${path}`;
  const params = new URLSearchParams({ url: transientImage, w: "640", output: "webp", n: "0", we: "" });
  params.sort();
  const sources = (transient ? [
    `https://img.transient.xyz/?${params}`,
    transientImage,
  ] : [
    objktCdnUrl(path),
    `https://gateway.pinata.cloud/ipfs/${path}`,
  ]).filter((source): source is string => !!source);
  for (const source of sources) {
    try {
      const input = await readImage(await fetch(source, { signal: AbortSignal.timeout(8000), redirect: "error" }));
      // Decode only the first frame: animated originals can be tens of megabytes.
      const output = await sharp(input, { animated: false, limitInputPixels: 40_000_000 })
        .rotate().resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
      return new Response(new Uint8Array(output), { headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      } });
    } catch { /* Try the next fixed gateway; never fetch arbitrary hosts. */ }
  }
  return Response.json({ error: "Thumbnail unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
}
