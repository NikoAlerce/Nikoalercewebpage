"use client";

import { Suspense, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useGLTF, useAnimations, View, PerspectiveCamera } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

// ────────────────────────────────────────────────────────────────────────────
// A small animated character (the green-hoodie Mixamo guy) that sits next to a
// section title and plays one looping clip.
//
// All animations live in ONE optimized GLB (public/characters/character.glb):
// the mesh is stored once, every clip merged onto the shared skeleton, the rescued
// diffuse baked in as WebP, geometry Draco-compressed → ~1.5 MB total.
//
// Rendering is NOT a per-character <Canvas> (that spawned one WebGL context each and
// blew past the browser's limit → "Context Lost" + memory growth). Instead every
// character draws into ONE shared context via drei <View>: this component renders a
// tracking <div> and a <View> whose scene is scissored to that div's screen rect by
// the single <CharacterStage> canvas mounted in AppShell.
// ────────────────────────────────────────────────────────────────────────────

const MODEL_URL = "/characters/character.glb";

export const CHARACTER_CLIPS = [
  "idle", "waving", "pointing", "hiphop",
  "robot", "searching", "breakdance", "pushing", "sitting",
] as const;
export type CharacterClip = (typeof CHARACTER_CLIPS)[number];

const CAM_FOV = 30;
const CAM_Z = 4.2;
// tracking-div box is `size * CANVAS_ASPECT` wide by `size` tall. Near-square so wide dance
// poses (arms/legs out at the peak of a clip) have room and don't clip at the sides — the
// figure is still scaled by HEIGHT, so widening only adds horizontal margin, not size.
const CANVAS_ASPECT = 1.0;
// Fraction of the frame HEIGHT the resting figure (bind-pose bone span) fills. Same for every
// clip → identical body size everywhere; the headroom absorbs raised-arm / jump / wide-dance
// poses without clipping.
const FILL = 0.78;

function CharacterModel({ clip, flip }: { clip: CharacterClip; flip: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL, true); // 2nd arg → Draco decoder

  // Skinned clone so the same clip can appear next to more than one title at once
  // without the instances fighting over a single scene graph.
  const model = useMemo(() => skeletonClone(scene), [scene]);

  // Use the GLB's OWN materials as authored in Blender (Principled BSDF → MeshStandardMaterial):
  // the diffuse-textured body, plus the solid colour groups (e.g. the red accent). They're
  // matte already (metallic 0 / roughness 1), so no override — we only tweak mesh render flags.
  // Materials are shared with the cached GLTF (via SkeletonUtils.clone), so we DON'T mutate or
  // dispose them here.
  useEffect(() => {
    const skeletons = new Set<THREE.Skeleton>();
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const sm = o as THREE.SkinnedMesh;
      if (sm.isSkinnedMesh && sm.skeleton) skeletons.add(sm.skeleton);
    });
    return () => {
      // Each SkeletonUtils clone owns a UNIQUE skeleton, whose boneTexture is a GPU texture
      // (bone matrices). Geometry/materials/diffuse are shared with the cached GLTF, but the
      // boneTexture is per-instance and R3F does NOT dispose <primitive> objects — so without
      // this it leaks one GPU texture per character on every route change.
      for (const sk of skeletons) {
        (sk.boneTexture as THREE.Texture | null)?.dispose();
        (sk as unknown as { dispose?: () => void }).dispose?.();
      }
    };
  }, [model]);

  // Two problems to solve once, in the model's local space:
  //  1) The Blender re-export's Armature carries an axis-convert rotation that the Mixamo
  //     clips (authored against an identity root) fight, laying the figure flat. Counter-
  //     rotating by the inverse of that quaternion stands every clip back up.
  //  2) Uniform sizing: scale is taken from the REST (bind-pose) height — identical for
  //     every clip — so the body is the same size in every section regardless of animation.
  //     The figure is then CENTRED on its clip's sampled motion (so hops/crouches stay framed).
  const { counter, fit } = useMemo(() => {
    model.updateMatrixWorld(true);

    const armQ = new THREE.Quaternion();
    let foundArm = false;
    model.traverse((o) => {
      if (!foundArm && /armature/i.test(o.name)) { armQ.copy(o.quaternion); foundArm = true; }
    });
    const counterQ = armQ.clone().invert();

    // Frustum half-extents at the figure plane.
    const halfH = CAM_Z * Math.tan((CAM_FOV / 2) * (Math.PI / 180));

    const bones: THREE.Bone[] = [];
    model.traverse((o) => { if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone); });
    const v = new THREE.Vector3();

    // (1) REFERENCE height from the BONES at the bind pose (measured before any clip sampling
    //     moves the skeleton). Same skeleton everywhere → a constant reference, so the body is
    //     the same size in every section regardless of which clip plays. (Bone world positions,
    //     not the geometry bbox, are the reliable scale for this re-exported rig.)
    const restBox = new THREE.Box3();
    for (const b of bones) { b.getWorldPosition(v).applyQuaternion(counterQ); restBox.expandByPoint(v); }
    const refH = restBox.getSize(new THREE.Vector3()).y || 1;
    const scale = (2 * halfH * FILL) / refH;

    // (2) CENTRE on the clip's motion: sample the chosen clip with a throwaway mixer and
    //     union the upright bone positions across the loop.
    const clipObj = animations.find((a) => a.name === clip) ?? animations[0];
    const motion = new THREE.Box3();
    if (clipObj && bones.length) {
      const mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(clipObj).play();
      const N = 24;
      for (let i = 0; i < N; i++) {
        mixer.setTime((clipObj.duration * i) / (N - 1));
        model.updateMatrixWorld(true);
        for (const b of bones) { b.getWorldPosition(v).applyQuaternion(counterQ); motion.expandByPoint(v); }
      }
      mixer.stopAllAction();
      mixer.uncacheClip(clipObj);
    } else {
      motion.copy(restBox);
    }
    const center = motion.getCenter(new THREE.Vector3());

    return {
      counter: [counterQ.x, counterQ.y, counterQ.z, counterQ.w] as [number, number, number, number],
      fit: {
        scale,
        position: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number],
      },
    };
  }, [model, animations, clip]);

  const { actions } = useAnimations(animations, group);
  useEffect(() => {
    const a = actions[clip];
    a?.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    return () => { a?.stop(); };
  }, [actions, clip]);

  return (
    <group ref={group}>
      <group rotation={[0, flip ? 0.4 : -0.4, 0]}>
        <primitive object={model} quaternion={counter} position={fit.position} scale={fit.scale} />
      </group>
    </group>
  );
}

type Props = {
  clip: CharacterClip;
  className?: string;
  /** rendered box height in px (width follows a portrait ratio) */
  size?: number;
  /** face the other way (mirror the slight turn) */
  flip?: boolean;
};

export default function TitleCharacter({ clip, className, size = 300, flip = false }: Props) {
  // <View> renders its OWN tracking div (carrying our className/size) and scissors the
  // character into it on the single shared <CharacterStage> canvas. It also skips drawing
  // when its div is off-screen, so no extra gating is needed.
  return (
    <View
      aria-hidden
      className={`nk-char${className ? " " + className : ""}`}
      style={{
        ["--nk-w"]: `${size * CANVAS_ASPECT}px`,
        ["--nk-h"]: `${size}px`,
        pointerEvents: "none",
      } as CSSProperties}
    >
      <PerspectiveCamera makeDefault fov={CAM_FOV} position={[0, 0, CAM_Z]} />
      <ambientLight intensity={0.9} color="#ffffff" />
      <directionalLight position={[2, 4, 5]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-3, 2, 2]} intensity={0.35} color="#ffffff" />
      <Suspense fallback={null}>
        <CharacterModel clip={clip} flip={flip} />
      </Suspense>
    </View>
  );
}

useGLTF.preload(MODEL_URL, true);
