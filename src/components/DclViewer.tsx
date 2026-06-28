"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Decentraland wearables are skinned to the avatar rig. We render them SKINNED
// (the skeleton orients the avatar standing up — baking the bind geometry instead
// lays it on its side). But the framing can't use the bind-pose bbox: some rigs
// have offset root bones (e.g. the ohde backpack's Avatar_Hips z=-100) that move
// the SKINNED mesh far from where the bind geometry sits, pushing it off-screen.
// So we measure the real post-skinning bounds with applyBoneTransform, then centre
// + normalise the whole thing into a rotating group.
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  const t = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const v = new THREE.Vector3();

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.frustumCulled = false; // skinned meshes cull incorrectly
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        // DCL wearables ship COLOR_0/1/2 zone MASKS (not real colours) → darken the
        // mesh when rendered as vertex colours; disable.
        const mm = m as THREE.Material & { vertexColors?: boolean };
        if (mm && mm.vertexColors) {
          mm.vertexColors = false;
          mm.needsUpdate = true;
        }
      }

      const pos = mesh.geometry.attributes.position;
      if (!pos) return;
      const sk = o as THREE.SkinnedMesh;
      if (sk.isSkinnedMesh && sk.skeleton) {
        sk.skeleton.update();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          sk.applyBoneTransform(i, v); // deform by the bind-pose skeleton
          v.applyMatrix4(sk.matrixWorld);
          box.expandByPoint(v);
        }
      } else {
        mesh.updateWorldMatrix(true, false);
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
          box.expandByPoint(v);
        }
      }
    });

    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    const ns = 1.9 / (Math.max(s.x, s.y, s.z) || 1);
    return {
      offset: c.multiplyScalar(-ns).toArray() as [number, number, number],
      scale: ns,
      bottom: -(s.y * ns) / 2,
    };
  }, [scene]);

  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.35;
  });

  return (
    <group ref={ref}>
      <group scale={t.scale} position={t.offset}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export default function DclViewer({ url }: { url: string }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#20222e] via-[#15161e] to-[#0b0c11] overflow-hidden">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 0.4, 3.6], fov: 34, near: 0.05, far: 100 }}
      >
        <ambientLight intensity={0.55} color="#dfe4ff" />
        <directionalLight position={[3, 5, 4]} intensity={1.4} color="#fff4e6" />
        <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#88aaff" />

        <Suspense fallback={null}>
          <Model url={url} />
          <Environment preset="studio" />
          <ContactShadows
            position={[0, -0.98, 0]}
            opacity={0.5}
            scale={7}
            blur={2.6}
            far={3}
            resolution={1024}
            color="#000000"
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          minDistance={1.8}
          maxDistance={7}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 1.75}
          target={[0, 0, 0]}
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 text-[8px] tracking-[0.4em] text-bone/30 pointer-events-none uppercase">
        Drag to rotate · scroll to zoom
      </div>
    </div>
  );
}
