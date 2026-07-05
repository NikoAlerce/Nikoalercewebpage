// Optimize a GLB in place: WebP-compress + resize its textures and Draco-compress
// its geometry. Safe to re-run (e.g. after re-exporting a model from Blender).
//
//   node scripts/optimize-glb.mjs <path-to.glb> [maxTextureSize=1024]
//
// Textures are usually the bulk of the weight, so shrinking them is the big win;
// Draco then compresses the mesh. Animations, skins and materials are preserved.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { dedup, weld, textureCompress } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";
import fs from "node:fs";

const file = process.argv[2];
const maxTex = parseInt(process.argv[3] || "1024", 10);
if (!file) { console.error("usage: node scripts/optimize-glb.mjs <file.glb> [maxTexSize]"); process.exit(1); }

const before = fs.statSync(file).size;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

const doc = await io.read(file);

await doc.transform(
  dedup(),
  weld(), // index the mesh (a prerequisite for Draco on non-indexed exports)
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [maxTex, maxTex], quality: 82 }),
);

// (Re-)enable Draco geometry compression.
doc.createExtension(KHRDracoMeshCompression)
  .setRequired(true)
  .setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER });

// A GLB must have a single buffer.
const root = doc.getRoot();
const main = root.listBuffers()[0];
for (const a of root.listAccessors()) a.setBuffer(main);
for (const b of root.listBuffers()) if (b !== main) b.dispose();

await io.write(file, doc);

const after = fs.statSync(file).size;
console.log(
  `${file}: ${(before / 1048576).toFixed(2)} MB → ${(after / 1048576).toFixed(2)} MB ` +
  `(-${Math.round((1 - after / before) * 100)}%)`,
);
