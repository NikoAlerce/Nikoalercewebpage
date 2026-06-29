"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ObjktToken } from "@/lib/types";
import { useNftMedia, usePlaylistMedia } from "./useNftMedia";

type Props = {
  token: ObjktToken;
  isActive: boolean;
  // Allowed to actually play its video (within the concurrent-video budget).
  shouldPlayVideo: boolean;
  // Close enough to pre-buffer its video (download ahead of time, no playback).
  shouldBufferVideo: boolean;
  // Digit sequence identifying the target GLB mesh, e.g. "574006" for Object_574.006.
  digits: string;
  // When set, this screen plays the given tokens as a looping video playlist (with sound).
  playlist?: ObjktToken[];
  // Reports the playlist's currently-playing track up to the gallery (for the HUD).
  onPlaylistTrack?: (token: ObjktToken) => void;
  // Mirror the texture horizontally (the curved screen's UVs project mirrored).
  flipU?: boolean;
  // Crosshair-targeting registry: registers the painted GLB mesh under `index`.
  index: number;
  targetsRef: React.MutableRefObject<Map<number, THREE.Object3D>>;
};

// three.js GLTFLoader strips dots/separators from node names ("Object_574.006" becomes
// "Object_574006"), so we match by the digit sequence instead of an exact name.
export function findMeshByDigits(scene: THREE.Object3D, digits: string): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  scene.traverse((o) => {
    if (found) return;
    const m = o as THREE.Mesh;
    if (m.isMesh && o.name.replace(/[^0-9]/g, "").includes(digits)) found = m;
  });
  return found;
}

/**
 * Recompute clean planar UVs for a wall mesh (its baked atlas UVs map into a texture
 * atlas, which stretches/rotates our texture). Map the most-vertical local axis to V and
 * the widest remaining axis to U, normalised 0..1. Returns the quad aspect (width/height).
 */
function recomputePlanarUV(mesh: THREE.Mesh): number {
  const geom = mesh.geometry as THREE.BufferGeometry;
  const pos = geom.getAttribute("position");
  if (!pos) return 1;

  mesh.updateWorldMatrix(true, false);
  const mw = mesh.matrixWorld;
  const up = new THREE.Vector3(0, 1, 0);
  const axisDirs = [
    new THREE.Vector3().setFromMatrixColumn(mw, 0).normalize(),
    new THREE.Vector3().setFromMatrixColumn(mw, 1).normalize(),
    new THREE.Vector3().setFromMatrixColumn(mw, 2).normalize(),
  ];
  const vAxis = [0, 1, 2].sort(
    (a, b) => Math.abs(axisDirs[b].dot(up)) - Math.abs(axisDirs[a].dot(up)),
  )[0];

  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const min = [bb.min.x, bb.min.y, bb.min.z];
  const ext = [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z];
  const others = [0, 1, 2].filter((i) => i !== vAxis);
  const uAxis = ext[others[0]] >= ext[others[1]] ? others[0] : others[1];

  const sizeU = ext[uAxis] || 1;
  const sizeV = ext[vAxis] || 1;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    uv[i * 2] = (p[uAxis] - min[uAxis]) / sizeU;
    uv[i * 2 + 1] = (p[vAxis] - min[vAxis]) / sizeV;
  }
  geom.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return sizeU / sizeV;
}

// Cover-fit: fill the quad keeping the image aspect (crop overflow, no stretch).
// `flipU` mirrors horizontally — needed where the mesh's planar UV projection runs
// opposite to the viewing direction (e.g. the curved screen), which otherwise shows
// the artwork / video mirrored.
function applyCover(tex: THREE.Texture, imgAspect: number, quadAspect: number, flipU = false) {
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  if (imgAspect > quadAspect) {
    const r = quadAspect / imgAspect;
    tex.repeat.set(r, 1);
    tex.offset.set((1 - r) / 2, 0);
  } else {
    const r = imgAspect / quadAspect;
    tex.repeat.set(1, r);
    tex.offset.set(0, (1 - r) / 2);
  }
  if (flipU) {
    tex.offset.x += tex.repeat.x;
    tex.repeat.x = -tex.repeat.x;
  }
  tex.needsUpdate = true;
}

/**
 * Permanently blacks out a GLB wall mesh. Used for the tall "slots:3" panels whose
 * artworks are rendered as floating planes in front — their underlying GLB mesh is never
 * painted, so its baked beige placeholder shows through (and z-fights the floating black
 * boxes). Recolouring the actual mesh black hides the beige and makes the z-fight black
 * on black (invisible).
 */
export function BlackoutMesh({ digits }: { digits: string }) {
  const { scene } = useThree();

  useEffect(() => {
    const mesh = findMeshByDigits(scene, digits);
    if (!mesh) return;
    const prevMaterial = mesh.material;
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, side: THREE.DoubleSide });
    mesh.material = mat;
    return () => {
      mesh.material = prevMaterial;
      mat.dispose();
    };
  }, [scene, digits]);

  return null;
}

/**
 * Paints an NFT's texture directly onto its GLB wall mesh (recomputing UVs + cover-fit),
 * so the artwork sits exactly on the gallery frame instead of a floating plane.
 */
export default function MeshScreen({ token, isActive, shouldPlayVideo, shouldBufferVideo, digits, playlist, onPlaylistTrack, flipU, index, targetsRef }: Props) {
  const { scene } = useThree();
  const hasPlaylist = !!playlist?.length;
  const single = useNftMedia(token, {
    active: hasPlaylist ? false : isActive,
    videoActive: hasPlaylist ? false : shouldPlayVideo,
    bufferActive: hasPlaylist ? false : shouldBufferVideo,
  });
  const pl = usePlaylistMedia(hasPlaylist ? playlist! : [], {
    active: shouldPlayVideo,
    withSound: true,
    onTrack: onPlaylistTrack,
  });
  const { map, aspect } = hasPlaylist ? { map: pl.map, aspect: pl.aspect } : single;

  // Register the painted GLB mesh for crosshair raycasting.
  useEffect(() => {
    const mesh = findMeshByDigits(scene, digits);
    if (!mesh) return;
    mesh.userData.unitIndex = index;
    const targets = targetsRef.current;
    targets.set(index, mesh);
    return () => { targets.delete(index); };
  }, [scene, digits, index, targetsRef]);

  useEffect(() => {
    const mesh = findMeshByDigits(scene, digits);
    if (!mesh) return;

    const geom = mesh.geometry as THREE.BufferGeometry;
    const prevUV = geom.getAttribute("uv");
    const prevMaterial = mesh.material;

    let mat: THREE.MeshBasicMaterial;
    if (map) {
      const quadAspect = recomputePlanarUV(mesh);
      applyCover(map, aspect ?? quadAspect, quadAspect, flipU);
      mat = new THREE.MeshBasicMaterial({ map, toneMapped: false, side: THREE.DoubleSide });
    } else {
      // NFT not loaded yet → paint the screen solid black instead of leaving the GLB's
      // baked placeholder painting showing through.
      mat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, side: THREE.DoubleSide });
    }
    mesh.material = mat;

    return () => {
      mesh.material = prevMaterial;
      if (prevUV) geom.setAttribute("uv", prevUV);
      mat.dispose();
    };
  }, [map, aspect, scene, digits, flipU]);

  return null;
}
