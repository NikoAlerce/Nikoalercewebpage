"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  shaderMaterial,
  Text,
  useGLTF,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  Glitch,
} from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

// =============================================================
//  GlitchOrb Shader
// =============================================================

const VOID_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vViewDir;
  varying float vGlitch;
  uniform float uTime;
  uniform float uDistort;
  uniform float uGlitchAmount;
  uniform vec2 uMouse;

  vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p){
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * snoise(p); p *= 2.05; a *= 0.5; }
    return v;
  }

  float band(float y, float t){
    return step(0.97, fract(sin(y*120.0 + t)*43758.5453));
  }

  void main(){
    vec3 pos = position;
    vec3 n = normal;
    float t = uTime * 0.35;
    float d = fbm(pos * 1.6 + vec3(t, t * 0.7, t * 0.3));
    pos += n * d * uDistort;
    float g = band(pos.y * 4.0, uTime * 6.0) * uGlitchAmount;
    float xshift = (fract(sin(uTime * 13.0 + pos.y * 30.0) * 7919.0) - 0.5) * 0.4;
    pos.x += xshift * g;
    pos.z += xshift * g * 0.6;
    vGlitch = g;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vWorld = (modelMatrix * vec4(pos, 1.0)).xyz;
    vNormal = normalize(normalMatrix * n);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const VOID_FRAG = /* glsl */ `
  varying vec3 vNormal; varying vec3 vWorld; varying vec3 vViewDir; varying float vGlitch;
  uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uEmissive; uniform float uTime;
  void main(){
    vec3 n = normalize(vNormal); vec3 v = normalize(vViewDir);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
    float sweep = sin(vWorld.y * 8.0 - uTime * 2.5) * 0.5 + 0.5;
    sweep = smoothstep(0.4, 0.95, sweep);
    vec3 base = mix(uColorA, uColorB, fres);
    vec3 emissive = uEmissive * (fres * 0.9 + sweep * 0.4 + vGlitch * 1.6);
    vec3 col = base + emissive;
    col.r += vGlitch * 0.6; col.b += vGlitch * 0.2;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const VoidMaterial = shaderMaterial(
  {
    uTime: 0, uDistort: 0.18, uGlitchAmount: 0.0,
    uMouse: new THREE.Vector2(0, 0),
    uColorA: new THREE.Color("#070707"),
    uColorB: new THREE.Color("#1a0205"),
    uEmissive: new THREE.Color("#ff0040"),
  },
  VOID_VERTEX,
  VOID_FRAG,
);

extend({ VoidMaterial });

type VoidMaterialImpl = THREE.ShaderMaterial & {
  uTime: number; uDistort: number; uGlitchAmount: number;
  uMouse: THREE.Vector2; uColorA: THREE.Color; uColorB: THREE.Color; uEmissive: THREE.Color;
};

declare module "@react-three/fiber" {
  interface ThreeElements {
    voidMaterial: import("@react-three/fiber").Object3DNode<VoidMaterialImpl, typeof VoidMaterial>;
  }
}

// =============================================================
//  GlitchOrb
// =============================================================

function GlitchOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<VoidMaterialImpl>(null);
  const glitchPulse = useRef(0);
  const glitchNext = useRef(2);

  useFrame((state, delta) => {
    const m = meshRef.current;
    const mat = matRef.current;
    if (!m || !mat) return;
    const t = state.clock.getElapsedTime();
    m.rotation.x = t * 0.12;
    m.rotation.y = t * 0.18;
    m.position.x += (state.mouse.x * 0.5 - m.position.x) * 0.04;
    m.position.y += (state.mouse.y * 0.35 - m.position.y) * 0.04;
    if (t > glitchNext.current) {
      glitchPulse.current = 1.0;
      glitchNext.current = t + 2 + Math.random() * 4;
    }
    glitchPulse.current = Math.max(0, glitchPulse.current - delta * 3.5);
    mat.uTime = t;
    mat.uMouse.set(state.mouse.x, state.mouse.y);
    mat.uGlitchAmount = glitchPulse.current * 0.6;
    mat.uDistort = 0.16 + Math.sin(t * 0.5) * 0.04;
  });

  return (
    <Float speed={1.0} rotationIntensity={0.2} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.4, 24]} />
        <voidMaterial ref={matRef} />
      </mesh>
    </Float>
  );
}

// =============================================================
//  Rings
// =============================================================

function Rings() {
  const group = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!group.current) return;
    group.current.rotation.z += dt * 0.05;
    group.current.rotation.x = Math.sin(s.clock.getElapsedTime() * 0.2) * 0.05;
  });
  return (
    <group ref={group}>
      {[2.4, 2.85, 3.35, 4.0].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2 + i * 0.18, i * 0.4, i]}>
          <torusGeometry args={[r, 0.004, 8, 220]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#ff0040" : "#00fff0"}
            transparent
            opacity={0.55 - i * 0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================
//  ReactiveParticles — particles that react to cursor
// =============================================================

function ReactiveParticles({ count = 500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const mouseTarget = useRef(new THREE.Vector2(0, 0));

  const basePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  const positions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const geom = ref.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const mx = state.mouse.x;
    const my = state.mouse.y;

    // Smooth mouse tracking
    mouseTarget.current.x += (mx - mouseTarget.current.x) * 0.05;
    mouseTarget.current.y += (my - mouseTarget.current.y) * 0.05;

    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      // Distance from cursor ray (approximate in screen space)
      const dx = bx - mouseTarget.current.x * 3;
      const dy = by - mouseTarget.current.y * 3;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repel = Math.max(0, 1 - dist / 2.5);

      // Push particles away from cursor
      const pushX = repel * dx * 0.6;
      const pushY = repel * dy * 0.6;

      // Organic drift
      const drift = Math.sin(t * 0.5 + i * 0.1) * 0.08;

      posAttr.setXYZ(
        i,
        bx + pushX + drift,
        by + pushY + Math.cos(t * 0.3 + i * 0.05) * 0.05,
        bz + Math.sin(t * 0.2 + i * 0.07) * 0.06,
      );
    }
    posAttr.needsUpdate = true;
    ref.current.rotation.y += dt * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// =============================================================
//  FloatingGLB — loads and displays a GLB model from IPFS
// =============================================================

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("http")) return uri;
  if (uri.startsWith("ipfs://")) return `${IPFS_GATEWAY}${uri.replace("ipfs://", "")}`;
  return uri;
}

function GLBModel({ url, position, scale = 0.4 }: { url: string; position: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => cloneSkeleton(scene as THREE.Object3D), [scene]);
  const groupRef = useRef<THREE.Group>(null);

  // Normalize the model
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;
    const ns = scale / maxDim;
    return { offset: center.clone().multiplyScalar(-ns), scale: ns };
  }, [cloned, scale]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += dt * 0.3;
    // Subtle float
    groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.8 + position[0]) * 0.15;
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive
        object={cloned}
        position={transform.offset.toArray()}
        scale={transform.scale}
      />
    </group>
  );
}

function FloatingGLB({ url, position, scale }: { url: string; position: [number, number, number]; scale?: number }) {
  return (
    <Suspense fallback={null}>
      <GLBModel url={url} position={position} scale={scale} />
    </Suspense>
  );
}

// =============================================================
//  TextCarousel — 3D interactive navigation
// =============================================================

interface CarouselItemProps {
  label: string;
  href: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  fontSize: number;
  onNavigate: (href: string) => void;
}

function CarouselItem({ label, href, color, position, rotation, fontSize, onNavigate }: CarouselItemProps) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_state, delta) => {
    if (!matRef.current) return;
    const target = hovered ? 8 : 1.2;
    matRef.current.emissiveIntensity += (target - matRef.current.emissiveIntensity) * delta * 8;
  });

  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={fontSize}
      letterSpacing={0.08}
      anchorX="center"
      anchorY="middle"
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      onClick={() => onNavigate(href)}
    >
      {label}
      <meshStandardMaterial
        ref={matRef}
        color={hovered ? color : "#ffffff"}
        emissive={color}
        emissiveIntensity={1.2}
        toneMapped={false}
        transparent
        opacity={hovered ? 1 : 0.85}
      />
    </Text>
  );
}

function TextCarousel() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5;
  const groupRef = useRef<THREE.Group>(null);
  const rotationY = useRef(0);

  const items = [
    { label: "WORKS", href: "/works", color: "#ff0040" },
    { label: "SIDEQUEST", href: "/sidequest", color: "#00fff0" },
    { label: "BIO", href: "/#about", color: "#a3ff00" },
    { label: "CONTACT", href: "/#about", color: "#ffffff" },
  ];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const mouseInfluence = state.mouse.x * 0.4;
    rotationY.current += delta * (0.15 + mouseInfluence);
    groupRef.current.rotation.y = rotationY.current;
    groupRef.current.rotation.x += (state.mouse.y * 0.08 - groupRef.current.rotation.x) * 0.05;
  });

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith("/#")) {
      const el = document.getElementById(href.slice(2));
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    window.location.href = href;
  }, []);

  const radius = isMobile ? 1.6 : 2.4;
  const fontSize = isMobile ? 0.28 : 0.48;

  return (
    <group ref={groupRef}>
      {items.map((item, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        return (
          <Suspense key={item.label} fallback={null}>
            <CarouselItem
              label={item.label}
              href={item.href}
              color={item.color}
              position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
              rotation={[0, -angle + Math.PI / 2, 0]}
              fontSize={fontSize}
              onNavigate={handleNavigate}
            />
          </Suspense>
        );
      })}
    </group>
  );
}

// =============================================================
//  Scene3D — full composition
// =============================================================

type GlbEntry = { url: string; position: [number, number, number]; scale: number };

export default function Scene3D({
  className,
  glbUrls = [],
}: {
  className?: string;
  glbUrls?: string[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  // Build GLB placement positions — orbit around the orb
  const glbEntries: GlbEntry[] = useMemo(() => {
    if (!glbUrls.length) return [];
    const maxShow = Math.min(glbUrls.length, 6); // Max 6 GLBs to keep perf
    return glbUrls.slice(0, maxShow).map((raw, i) => {
      const angle = (i / maxShow) * Math.PI * 2 + Math.PI / 4; // offset from text
      const r = 3.2 + (i % 2) * 0.8;
      const y = -0.8 + (i % 3) * 0.6;
      return {
        url: ipfsToHttp(raw),
        position: [Math.cos(angle) * r, y, Math.sin(angle) * r] as [number, number, number],
        scale: 0.35 + (i % 2) * 0.1,
      };
    });
  }, [glbUrls]);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    let inView = true;
    let pageVisible = typeof document !== "undefined" ? !document.hidden : true;
    const update = () => setActive(inView && pageVisible);
    const obs = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          for (const e of entries) inView = e.isIntersecting;
          update();
        }, { rootMargin: "100px 0px" })
      : null;
    obs?.observe(node);
    const onVis = () => { pageVisible = !document.hidden; update(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { obs?.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  if (reducedMotion) {
    return (
      <div className={className} style={{ background: "radial-gradient(ellipse at center, #1a0205 0%, #000 60%)" }} />
    );
  }

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
        dpr={[1, 1.25]}
        frameloop={active ? "always" : "never"}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 5, 14]} />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <GlitchOrb />
          <Rings />
        </Suspense>

        {/* Cursor-reactive particles */}
        <ReactiveParticles count={450} />

        {/* 3D Text carousel */}
        <TextCarousel />

        {/* Floating GLB models from OBJKT */}
        {glbEntries.map((entry, i) => (
          <FloatingGLB key={i} url={entry.url} position={entry.position} scale={entry.scale} />
        ))}

        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.22} luminanceSmoothing={0.65} mipmapBlur radius={0.55} />
          <Glitch delay={new THREE.Vector2(3.5, 8.0)} duration={new THREE.Vector2(0.05, 0.16)} strength={new THREE.Vector2(0.05, 0.15)} mode={GlitchMode.SPORADIC} ratio={0.85} active />
          <Noise opacity={0.04} premultiply blendFunction={BlendFunction.SCREEN} />
          <Vignette eskil={false} offset={0.22} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
