"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// =============================================================
//  HeroModel — elegant single-GLB showcase (replaces the old glitch Scene3D).
//  One optimized GLB (/hero.glb, draco + webp), studio-lit, on a soft contact
//  shadow, slow turntable + subtle cursor parallax. No orb / rings / particles /
//  glitch post — the piece itself is the hero.
// =============================================================

function HeroGLB() {
  const ref = useRef<THREE.Group>(null);
  // Draco-compressed → useGLTF(url, true) wires drei's Draco loader.
  const { scene, animations } = useGLTF("/hero.glb", true);
  const { actions, names } = useAnimations(animations, ref);

  // Center on X/Z and rest its feet on y=0, scaled to a consistent height.
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.6 / (Math.max(size.x, size.y, size.z) || 1);
    return {
      position: [-center.x * scale, -box.min.y * scale, -center.z * scale] as [number, number, number],
      scale,
    };
  }, [scene]);

  // Play every animation (it's a complex multi-armature scene — they all run together).
  useEffect(() => {
    names.forEach((n) => actions[n]?.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.6).play());
    return () => { names.forEach((n) => actions[n]?.stop()); };
  }, [actions, names]);

  // Slow turntable + a gentle cursor-driven tilt/parallax (no drag needed).
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += dt * 0.14;
    g.rotation.x += (-state.pointer.y * 0.1 - g.rotation.x) * 0.04;
    g.position.x += (state.pointer.x * 0.25 - g.position.x) * 0.04;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} position={fit.position} scale={fit.scale} />
    </group>
  );
}

export default function HeroModel({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Pause the render loop when the hero is offscreen or the tab is hidden.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    let inView = true;
    let visible = typeof document !== "undefined" ? !document.hidden : true;
    const update = () => setActive(inView && visible);
    const obs = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((es) => { for (const e of es) inView = e.isIntersecting; update(); }, { rootMargin: "100px 0px" })
      : null;
    obs?.observe(node);
    const onVis = () => { visible = !document.hidden; update(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { obs?.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  // Reduced-motion users get a calm static backdrop instead of the animated scene.
  if (reduced) {
    return <div className={className} style={{ background: "radial-gradient(ellipse at 50% 60%, #1c1c22 0%, #050506 70%)" }} />;
  }

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        camera={{ position: [0, 1.15, 5.2], fov: 38 }}
        dpr={isMobile ? [1, 1.2] : [1, 1.7]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        frameloop={active ? "always" : "never"}
      >
        {/* Soft studio key/fill/rim — neutral and warm, lets the materials read. */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 7, 5]} intensity={2.1} color="#fff4ea" />
        <directionalLight position={[-6, 2, -3]} intensity={0.7} color="#a9c6ff" />
        <pointLight position={[0, 3, -5]} intensity={0.8} color="#ffd9b0" distance={16} decay={2} />

        <Suspense fallback={null}>
          {/* City env gives the metallic / specular materials something to reflect. */}
          <Environment preset="city" />
          <HeroGLB />
          {/* Grounding shadow under the feet. */}
          <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={9} blur={2.6} far={4} resolution={isMobile ? 256 : 512} color="#000000" />
        </Suspense>

        {/* Restrained post: soft bloom on emissive highlights + a light vignette. No glitch. */}
        {!isMobile && (
          <EffectComposer multisampling={4}>
            <Bloom intensity={0.5} luminanceThreshold={0.62} luminanceSmoothing={0.3} mipmapBlur />
            <Vignette eskil={false} offset={0.3} darkness={0.7} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}

useGLTF.preload("/hero.glb", true);
