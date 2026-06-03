"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

export default function GalleryScene() {
  const { scene } = useGLTF("/artgalery.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = true;

        if (child.material) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const m of mats) {
            if (!m) continue;
            // Keep emissive lights on the model (lamp inner bodies)
            if ("roughness" in m) {
              m.roughness = Math.min((m as any).roughness ?? 0.8, 0.95);
              m.metalness = (m as any).metalness ?? 0;
            }
            m.needsUpdate = true;
          }
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} position={[0, 0, 0]} scale={[1, 1, 1]} />;
}

useGLTF.preload("/artgalery.glb");
