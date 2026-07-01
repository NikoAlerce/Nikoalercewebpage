// Builds ONE optimized character GLB from the per-animation Mixamo GLBs.
//
// MESH / UVs / TEXTURE / SKELETON come from public/conuvcorrecto.glb — the build
// the artist re-exported with the CORRECT UV unwrap + baked diffuse ("simple bake").
// The earlier *.fbx.glb conversions carry the same skeleton but a BROKEN UV layout,
// so we only mine them for their ANIMATION CLIPS and re-bind those onto the good mesh.
//
//  · good mesh + skeleton + UV + texture kept from conuvcorrecto.glb (43k verts)
//  · every chosen animation merged in as a named clip, re-bound to the shared skeleton
//    (the .fbx.glb bones are named `mixamorigNeck`; the good ones `mixamorig:Neck` —
//     we reconcile by stripping the colon, the 33 bones then match 1:1)
//  · geometry Draco-compressed, texture → WebP 1024
//
// Run: node scripts/build-character.mjs
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, resample, textureCompress, mergeDocuments } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FBX_DIR = path.join(ROOT, "public", "fbx");
const OUT_DIR = path.join(ROOT, "public", "characters");
const BASE_GLB = path.join(ROOT, "public", "conuvcorrecto.glb"); // good mesh + UV + texture

// clip name (in the final GLB)  ->  animation-source file (mesh ignored, only the clip is used)
const CLIPS = {
  idle: "Idle.fbx.glb",
  waving: "Waving.fbx.glb",
  pointing: "Kneeling Pointing.fbx.glb",
  hiphop: "Hip Hop Dancing.fbx.glb",
  robot: "Robot Hip Hop Dance.fbx.glb",
  searching: "Searching Pockets.fbx.glb",
  breakdance: "Breakdance Freezes.fbx.glb",
  pushing: "Pushing.fbx.glb",
  sitting: "Sitting Idle.fbx.glb",
};

const normBone = (s) => s.replace(/:/g, ""); // `mixamorig:Neck` -> `mixamorigNeck`

async function main() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });

  // ── Base document: the GOOD mesh + skeleton + UV + texture. ──
  const doc = await io.read(BASE_GLB);
  const root = doc.getRoot();

  // Drop whatever animations the base file shipped with (ugly auto names); we only
  // want the 9 we re-bind below.
  for (const a of root.listAnimations()) a.dispose();

  // Index the base skeleton by colon-stripped name so the .fbx.glb channels (no colon)
  // can find their target bone here.
  const baseNodeByName = new Map();
  for (const n of root.listNodes()) baseNodeByName.set(normBone(n.getName()), n);
  const baseScene = root.listScenes()[0];

  const missingNames = new Set();

  for (const [clipName, file] of Object.entries(CLIPS)) {
    const src = await io.read(path.join(FBX_DIR, file));
    const srcAnims = src.getRoot().listAnimations();

    // mergeDocuments copies src into doc and returns a source→clone map.
    const map = mergeDocuments(doc, src);

    // The just-merged animation(s) still target src's (now-cloned) bones — re-bind by name.
    const added = srcAnims.map((a) => map.get(a)).filter(Boolean);
    for (const anim of added) {
      anim.setName(clipName);
      for (const ch of anim.listChannels()) {
        const tgt = ch.getTargetNode();
        if (!tgt) continue;
        const baseNode = baseNodeByName.get(normBone(tgt.getName()));
        if (baseNode) ch.setTargetNode(baseNode);
        else missingNames.add(tgt.getName());
      }
    }
  }

  // Drop every scene except the good one (the merges dragged in duplicate scenes/meshes).
  root.setDefaultScene(baseScene);
  for (const s of root.listScenes()) if (s !== baseScene) s.dispose();

  // prune() alone can't shed the duplicate skeletons: each merged .fbx.glb left a Skin
  // whose joint cycle keeps its mesh + bones alive. Manually dispose everything that no
  // longer hangs off the good scene (skins → meshes → nodes, in that order).
  const keep = new Set();
  baseScene.traverse((n) => keep.add(n));
  for (const skin of root.listSkins()) {
    if (!root.listNodes().some((n) => keep.has(n) && n.getSkin() === skin)) skin.dispose();
  }
  for (const mesh of root.listMeshes()) {
    if (!root.listNodes().some((n) => keep.has(n) && n.getMesh() === mesh)) mesh.dispose();
  }
  for (const n of root.listNodes()) if (!keep.has(n)) n.dispose();

  // Keep the good (already-textured) material sane for an unlit-ish look on a black page.
  for (const mat of root.listMaterials()) {
    mat.setBaseColorFactor([1, 1, 1, 1]);
    mat.setMetallicFactor(0);
    mat.setRoughnessFactor(1);
  }

  // ── Optimize. ──
  // NOTE: NO weld() / NO Draco. The character has a body layer under the hoodie/pants;
  // Draco position quantization (and weld vertex-merging) shifted the surfaces enough that
  // the limbs poked through the clothing. We keep the geometry byte-for-byte as the artist
  // exported it and only compress the texture — slightly larger file, correct mesh.
  await doc.transform(
    dedup(),
    resample(), // collapse redundant keyframes (animation only, geometry untouched)
    prune({ keepLeaves: false }),
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }),
  );

  // Each merged source contributed its own Buffer; a GLB must have exactly one, so
  // point every accessor at the first buffer and drop the rest.
  const mainBuffer = root.listBuffers()[0];
  for (const acc of root.listAccessors()) acc.setBuffer(mainBuffer);
  for (const buf of root.listBuffers()) if (buf !== mainBuffer) buf.dispose();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, "character.glb");
  await io.write(outFile, doc);

  const size = fs.statSync(outFile).size;
  console.log(`\n✓ wrote ${path.relative(ROOT, outFile)} — ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  clips: ${root.listAnimations().map((a) => a.getName()).join(", ")}`);
  console.log(`  meshes: ${root.listMeshes().length} | materials: ${root.listMaterials().length} | textures: ${root.listTextures().length}`);
  if (missingNames.size) console.warn(`  ⚠ unmatched bones (left as-is): ${[...missingNames].join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
