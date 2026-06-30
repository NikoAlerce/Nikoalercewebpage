"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, ContactShadows, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// Graffiti "throw-up" face for the 3D section labels (troika reads ttf/otf/woff, not woff2).
const FONT = "/fonts/throwup-fill.otf";

const SECTIONS = [
  { label: "Art on Tezos", href: "/art-on-tezos" },
  { label: "Music", href: "/music" },
  { label: "Gallery", href: "/metaverse" },
  { label: "Decentraland", href: "/decentraland" },
  { label: "Shop", href: "/shop" },
  { label: "AR Labs", href: "/ar-labs" },
];
const N = SECTIONS.length;
const PARTY_Y = 1.28;  // height of the grass platform / the characters (the "party")

// One wide establishing shot of the whole beast; the rest drop you INTO the party — close,
// near eye level with the characters, looking across them from different sides. az = orbit
// angle, polar = pitch (~1.57 = horizontal), dist = how close, ty = look height, off = [x,z]
// target offset on the platform, labelY/font = where/how big the 3D word floats.
// polar ~1.57 = horizontal (eye level); < 1.57 looks DOWN ("from above"), > 1.57 looks up.
// Per-shot composition knobs:
//  aim = push the creature sideways in frame (+ = creature moves LEFT, − = moves RIGHT),
//        opening a clear lane for the word (rule of thirds).
//  lx/ly = the word's INNER edge, as a fraction of half-width/half-height (lx: + = right of
//        centre, − = left; ly: + = up, − = down). The word grows OUTWARD from there toward the
//        screen edge, so it never crosses back over the creature.
//  font = world size of the word (authored per shot).
const STATION_CFG: { az: number; polar: number; dist: number; ty: number; aim: number; lx: number; ly: number; font: number; off?: [number, number] }[] = [
  { az: 0.45, polar: 1.54,  dist: 6.9,  ty: 1.05,           aim:  1.7, lx:  0.0,  ly:  0.14, font: 0.24 },                      // 0 Art on Tezos — creature left, big word right
  { az: 1.55, polar: 1.585, dist: 1.78, ty: PARTY_Y + 0.12, aim:  0.5, lx:  0.22, ly:  0.42, font: 0.3,  off: [0.08, 0.04] },  // 1 Music — upper-right
  { az: 2.95, polar: 1.595, dist: 1.74, ty: PARTY_Y + 0.10, aim: -0.5, lx: -0.22, ly:  0.30, font: 0.3,  off: [-0.06, 0.08] }, // 2 Gallery — left
  { az: 4.35, polar: 1.580, dist: 1.88, ty: PARTY_Y + 0.14, aim:  0.5, lx:  0.05, ly: -0.04, font: 0.2,  off: [0.05, -0.08] }, // 3 Decentraland — right (long word, smaller)
  { az: 5.55, polar: 1.595, dist: 1.78, ty: PARTY_Y + 0.10, aim: -0.5, lx: -0.22, ly:  0.18, font: 0.3,  off: [-0.03, 0.03] }, // 4 Shop — left
  { az: 6.10, polar: 1.585, dist: 1.82, ty: PARTY_Y + 0.12, aim:  0.5, lx:  0.18, ly:  0.40, font: 0.3,  off: [0.04, -0.04] }, // 5 AR Labs — upper-right
];
const STATIONS = SECTIONS.map((s, i) => {
  const c = STATION_CFG[i] ?? STATION_CFG[0];
  const off = c.off ?? [0, 0];
  const target = new THREE.Vector3(off[0], c.ty, off[1]);
  const sinP = Math.sin(c.polar), cosP = Math.cos(c.polar);
  const cam = new THREE.Vector3(
    target.x + c.dist * sinP * Math.sin(c.az),
    target.y + c.dist * cosP,
    target.z + c.dist * sinP * Math.cos(c.az),
  );
  return { ...s, cam, target, dist: c.dist, aim: c.aim, lx: c.lx, ly: c.ly, font: c.font };
});

// Reusable temps for the camera aim shift (single hero instance — safe to share).
const _dir = new THREE.Vector3();
const _right = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _UP = new THREE.Vector3(0, 1, 0);

// ── The animated GLB, centered on origin, feet at y=0, slow idle spin ──
function Beast() {
  const ref = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/hero.glb", true);
  const { actions, names, mixer } = useAnimations(animations, ref);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const c = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const scale = 2.6 / (Math.max(sz.x, sz.y, sz.z) || 1);
    return { position: [-c.x * scale, -box.min.y * scale, -c.z * scale] as [number, number, number], scale };
  }, [scene]);

  useEffect(() => {
    mixer.timeScale = 0.55; // slow the whole party down — the default mixamo speed is frenetic
    names.forEach((n) => actions[n]?.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.6).play());
    return () => { names.forEach((n) => actions[n]?.stop()); };
  }, [actions, names, mixer]);

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.03; });

  return <group ref={ref}><primitive object={scene} position={fit.position} scale={fit.scale} /></group>;
}

// ── Cinematic camera: damp toward the active station + a tiny idle drift ──
function CameraRig({ index }: { index: number }) {
  const { camera, size } = useThree();
  const pos = useRef(new THREE.Vector3().copy(STATIONS[0].cam));
  const look = useRef(new THREE.Vector3().copy(STATIONS[0].target));
  useEffect(() => { camera.position.copy(STATIONS[0].cam); camera.lookAt(STATIONS[0].target); }, [camera]);

  // The browser is wide & short; three's FOV is VERTICAL, so a fixed FOV crops the tall
  // "creature" and pitches the party shots into a high angle. Widen the vertical FOV as the
  // viewport gets wider so widescreen regains headroom (square previews stay tighter).
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    cam.fov = THREE.MathUtils.clamp(31 + Math.max(0, aspect - 1.1) * 8, 31, 44);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useFrame((state, dt) => {
    const st = STATIONS[index];
    // Slow, cinematic glide. Higher base = more "remaining" each second = slower settle
    // (0.0016 ≈ snaps in ~0.5s; 0.18 ≈ a smooth ~2.5s drift between stations).
    const k = 1 - Math.pow(0.18, dt);
    pos.current.lerp(st.cam, k);
    look.current.lerp(st.target, k);
    const t = state.clock.elapsedTime;
    camera.position.set(
      pos.current.x + Math.sin(t * 0.3) * 0.035,
      pos.current.y + Math.sin(t * 0.45) * 0.028,
      pos.current.z + Math.cos(t * 0.27) * 0.035,
    );
    // Aim sideways off the creature so it sits off-centre, leaving a clear lane for the word.
    _dir.subVectors(look.current, camera.position).normalize();
    _right.crossVectors(_dir, _UP).normalize();
    _aim.copy(look.current).addScaledVector(_right, STATIONS[index].aim);
    camera.lookAt(_aim);
  });
  return null;
}

// ── The focused section's name as a 3D word, PINNED to the camera so it always sits
//    in the same spot of the frame at every station — never drifts off screen. It lives
//    in the LEFT negative space (the GLB sits centre/right), aligned to the same left
//    margin as the kicker + wordmark, so it's a prominent scene element WITHOUT covering
//    the GLB. Drawn on top (depthTest off) so it stays readable. Click = navigate. ──
const LABEL_DIST = 2.1;     // how far in front of the camera the word floats
// Horizontal/vertical placement is authored PER STATION (st.lx / st.ly) so each word lands in
// that shot's clear negative space and the page stays balanced against the bottom-left wordmark.

function ActiveLabel({ index, onSelect }: { index: number; onSelect: (i: number) => void }) {
  const st = STATIONS[index];
  const { camera } = useThree();
  const grp = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const fade = useRef(0);
  const tmp = useRef(new THREE.Vector3()).current;
  const [hover, setHover] = useState(false);

  // Anchor at the INNER edge and grow OUTWARD (toward the screen edge) so the word never
  // crosses back over the creature. lx ≥ 0 → word lives on the right, left-anchored, grows
  // right; lx < 0 → lives on the left, right-anchored, grows left.
  const anchorX: "left" | "right" = st.lx >= 0 ? "left" : "right";
  const fontSize = st.font;

  useEffect(() => { fade.current = 0; }, [index]);

  useFrame((state, dt) => {
    fade.current = Math.min(1, fade.current + dt * 1.5);
    if (mat.current) mat.current.opacity = fade.current * (hover ? 1 : 0.95);
    const g = grp.current;
    if (!g) return;
    // Place by frame FRACTION (compute the frustum size at LABEL_DIST), so the on-screen
    // position is identical at any aspect ratio. Then face the camera (billboard).
    const cam = camera as THREE.PerspectiveCamera;
    const vH = 2 * LABEL_DIST * Math.tan((cam.fov * Math.PI) / 360);
    const vW = vH * cam.aspect;
    tmp.set((st.lx * vW) / 2, (st.ly * vH) / 2, -LABEL_DIST)
      .applyQuaternion(camera.quaternion)
      .add(camera.position);
    g.position.copy(tmp);
    g.quaternion.copy(camera.quaternion);
    // Gentle entrance + idle float so it reads as alive, not a static caption.
    const t = state.clock.elapsedTime;
    g.scale.setScalar(0.8 + fade.current * 0.2);
    g.position.y += Math.sin(t * 0.9) * 0.012;
  });

  return (
    <group ref={grp} renderOrder={20}>
      <Text
        font={FONT}
        fontSize={fontSize}
        anchorX={anchorX}
        anchorY="middle"
        maxWidth={2.8}
        textAlign={anchorX}
        renderOrder={20}
        onClick={(e) => { e.stopPropagation(); onSelect(index); }}
        onPointerOver={() => { setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      >
        {st.label}
        <meshBasicMaterial
          ref={mat}
          color={hover ? "#e3322b" : "#f7f5ef"}
          transparent
          opacity={0}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </Text>
    </group>
  );
}

// ── Slow drifting motes / fireflies — the "magic" against the pure-black stage.
//    Warm, additive, caught by the bloom so they glow softly. ──
function Motes({ count = 130 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 1.3 + Math.random() * 3.4;
      const th = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(th) * r;
      pos[i * 3 + 1] = Math.random() * 3.4 - 0.3;
      pos[i * 3 + 2] = Math.sin(th) * r;
      spd[i] = 0.04 + Math.random() * 0.1;
    }
    return { pos, spd };
  }, [count]);

  useFrame((state, dt) => {
    const p = ref.current;
    if (!p) return;
    const attr = p.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + data.spd[i] * dt;
      if (y > 3.3) y = -0.3;
      attr.setY(i, y);
      attr.setX(i, attr.getX(i) + Math.sin(t * 0.25 + i * 0.6) * 0.0007);
    }
    attr.needsUpdate = true;
    p.rotation.y += dt * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.028} color="#ffe6c2" transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Scene({ index, onSelect, mobile }: { index: number; onSelect: (i: number) => void; mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 7, 5]} intensity={2.1} color="#fff4ea" />
      <directionalLight position={[-6, 2, -3]} intensity={0.7} color="#a9c6ff" />
      <pointLight position={[0, 3, -5]} intensity={0.8} color="#ffd9b0" distance={16} decay={2} />

      {/* CameraRig first so its per-frame camera update lands BEFORE ActiveLabel reads it. */}
      <CameraRig index={index} />

      <Suspense fallback={null}>
        <Environment preset="city" />
        <Beast />
        <Motes count={mobile ? 70 : 130} />
        <ActiveLabel index={index} onSelect={onSelect} />
        <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={9} blur={2.6} far={4} resolution={mobile ? 256 : 512} color="#000000" />
      </Suspense>

      {!mobile && (
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.7} luminanceThreshold={0.5} luminanceSmoothing={0.35} mipmapBlur />
          <Vignette eskil={false} offset={0.28} darkness={0.75} />
        </EffectComposer>
      )}
    </>
  );
}

export default function HeroExperience({ className }: { className?: string }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);

  // Click a label: if it's the focused one, navigate; otherwise rotate the camera to it.
  const onSelect = (i: number) => {
    if (i === index) router.push(SECTIONS[i].href);
    else setIndex(i);
  };
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + N) % N);

  // Auto-advance the cinematic tour; resets whenever the index changes (manual or auto).
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % N), 9500);
    return () => clearTimeout(t);
  }, [index, reduced]);

  // Pause the render loop offscreen / hidden tab.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    let inView = true, visible = typeof document !== "undefined" ? !document.hidden : true;
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
    setMobile(window.innerWidth < 768);
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  if (reduced) {
    return <div className={className} style={{ background: "radial-gradient(ellipse at 50% 60%, #1c1c22 0%, #050506 70%)" }} />;
  }

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        camera={{ position: [STATIONS[0].cam.x, STATIONS[0].cam.y, STATIONS[0].cam.z], fov: 34 }}
        dpr={mobile ? [1, 1.2] : [1, 1.7]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        frameloop={active ? "always" : "never"}
      >
        <Scene index={index} onSelect={onSelect} mobile={mobile} />
      </Canvas>

      {/* Carousel arrows */}
      <button
        aria-label="Previous"
        onClick={() => go(-1)}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 md:w-[4.5rem] md:h-[4.5rem] grid place-items-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-bone/80 hover:text-bone hover:border-accent hover:bg-black/50 transition-colors"
      >
        <span className="text-4xl md:text-5xl leading-none -mt-1">‹</span>
      </button>
      <button
        aria-label="Next"
        onClick={() => go(1)}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 md:w-[4.5rem] md:h-[4.5rem] grid place-items-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-bone/80 hover:text-bone hover:border-accent hover:bg-black/50 transition-colors"
      >
        <span className="text-4xl md:text-5xl leading-none -mt-1">›</span>
      </button>

      {/* Station dots */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {SECTIONS.map((s, i) => (
          <button
            key={s.href}
            aria-label={s.label}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-accent" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

useGLTF.preload("/hero.glb", true);
