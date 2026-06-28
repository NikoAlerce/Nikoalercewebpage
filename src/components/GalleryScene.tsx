"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// Loads the gallery model (nuevagalery.glb) and flags every mesh as collidable so
// PlayerControls' forward raycast stops you at walls / objects.
export default function GalleryScene() {
  const { scene } = useGLTF("/nuevagalery.glb", true);
  const sceneRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = true;
        child.userData.isCollidable = true;

        // Build a BVH so PlayerControls' per-frame collision raycast against the
        // huge gallery mesh is fast (computeBoundsTree is patched on in PlayerControls).
        const geom = child.geometry as THREE.BufferGeometry & { computeBoundsTree?: () => void; boundsTree?: unknown };
        if (geom && !geom.boundsTree && typeof geom.computeBoundsTree === "function") {
          geom.computeBoundsTree();
        }

        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          if (!m) continue;
          if ("roughness" in m) {
            (m as THREE.MeshStandardMaterial).roughness = Math.min(
              (m as THREE.MeshStandardMaterial).roughness ?? 0.8,
              0.95,
            );
          }
          m.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return <primitive ref={sceneRef} object={scene} position={[0, 0, 0]} scale={[1, 1, 1]} />;
}

useGLTF.preload("/nuevagalery.glb", true);
