// Builds the social-share thumbnail and browser-tab icon from the character bust capture
// (public/char-source-bust.png, 630x300 — a transparent-background crop of the site's own
// waving character, captured live off the shared CharacterStage canvas). Composites it onto
// the site's brand black (#000000, matches --void) so it reads as a clean card/icon anywhere.
//
// Run: node scripts/gen-og-assets.mjs
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public", "char-source-bust.png");
const VOID = { r: 0, g: 0, b: 0, alpha: 1 };
// Hand-picked square (within the 630x300 source) framing just the hood/face, clear of the
// raised waving hand — found by eye, since auto-detecting "face vs. hand" isn't worth
// building for a one-off crop. Re-pick these if char-source-bust.png is ever re-captured.
const FACE_BOX = { left: 288, top: 52, width: 136, height: 136 };

async function main() {
  const src = sharp(SRC);
  const trimmed = await src.trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  const { data, info } = trimmed;
  const charW = info.width, charH = info.height;

  // ── Social share card (1200x630) ──
  const OG_W = 1200, OG_H = 630;
  const targetH = Math.round(OG_H * 0.88);
  const scale = targetH / charH;
  const resized = await sharp(data).resize({ height: targetH }).toBuffer();
  const resizedW = Math.round(charW * scale);
  await sharp({ create: { width: OG_W, height: OG_H, channels: 4, background: VOID } })
    .composite([{ input: resized, left: Math.round((OG_W - resizedW) / 2), top: OG_H - targetH }])
    .png()
    .toFile(path.join(ROOT, "src", "app", "opengraph-image.png"));

  // ── Browser tab / bookmark icon: FACE ONLY, no hand. ──
  // At 32px the waving-hand silhouette turns into an unreadable blob; a hooded face reads
  // as a person at any size. Crop the hand-picked FACE_BOX from the (untrimmed) source.
  const iconCrop = await sharp(SRC).extract(FACE_BOX).toBuffer();

  for (const [name, size] of [["icon.png", 256], ["apple-icon.png", 180]]) {
    const fit = Math.round(size * 0.94);
    const rs = await sharp(iconCrop).resize({ width: fit, height: fit, fit: "cover" }).toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: VOID } })
      .composite([{ input: rs, left: Math.round((size - fit) / 2), top: Math.round((size - fit) / 2) }])
      .png()
      .toFile(path.join(ROOT, "src", "app", name));
  }

  console.log(`✓ opengraph-image.png (${OG_W}x${OG_H}), icon.png (256), apple-icon.png (180)`);
  console.log(`  source bust: ${charW}x${charH} trimmed, icon face box: ${FACE_BOX.width}x${FACE_BOX.height}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
