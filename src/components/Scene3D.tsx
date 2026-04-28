"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { Environment, Float, shaderMaterial, Text } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  Glitch,
} from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";
import * as THREE from "three";

// =============================================================
//  GlitchOrb — esfera con vertex shader que combina simplex
//  noise 3D + tearing glitch en bandas horizontales aleatorias.
//  PBR material: dark metallic surface with inner red neon emission.
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

  // Classic 3D simplex noise (Ashima Arts, MIT)
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
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  // Bandas pseudo-aleatorias que pulsan: tearing glitch en Y
  float band(float y, float t){
    float b = step(0.97, fract(sin(y*120.0 + t)*43758.5453));
    return b;
  }

  void main(){
    vec3 pos = position;
    vec3 n = normal;

    // Mouse parallax barrel
    float ang = atan(pos.y, pos.x);
    float mx = uMouse.x * 0.5;
    float my = uMouse.y * 0.5;

    // Slow organic distortion via fbm
    float t = uTime * 0.35;
    float d = fbm(pos * 1.6 + vec3(t, t * 0.7, t * 0.3));
    pos += n * d * uDistort;

    // Glitch tear: bands offset along x in random Y stripes
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
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vViewDir;
  varying float vGlitch;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uEmissive;
  uniform float uTime;

  void main(){
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);

    // Vertical sweep
    float sweep = sin(vWorld.y * 8.0 - uTime * 2.5) * 0.5 + 0.5;
    sweep = smoothstep(0.4, 0.95, sweep);

    vec3 base = mix(uColorA, uColorB, fres);
    vec3 emissive = uEmissive * (fres * 0.9 + sweep * 0.4 + vGlitch * 1.6);

    vec3 col = base + emissive;
    // Slight chroma split when glitching
    col.r += vGlitch * 0.6;
    col.b += vGlitch * 0.2;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VoidMaterial = shaderMaterial(
  {
    uTime: 0,
    uDistort: 0.18,
    uGlitchAmount: 0.0,
    uMouse: new THREE.Vector2(0, 0),
    uColorA: new THREE.Color("#070707"),
    uColorB: new THREE.Color("#1a0205"),
    uEmissive: new THREE.Color("#ff0040"),
  },
  VOID_VERTEX,
  VOID_FRAG,
);

extend({ VoidMaterial });

// TS declaration for the custom material
type VoidMaterialImpl = THREE.ShaderMaterial & {
  uTime: number;
  uDistort: number;
  uGlitchAmount: number;
  uMouse: THREE.Vector2;
  uColorA: THREE.Color;
  uColorB: THREE.Color;
  uEmissive: THREE.Color;
};

declare module "@react-three/fiber" {
  interface ThreeElements {
    voidMaterial: import("@react-three/fiber").Object3DNode<
      VoidMaterialImpl,
      typeof VoidMaterial
    >;
  }
}

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
    const mx = state.mouse.x;
    const my = state.mouse.y;
    m.position.x += (mx * 0.5 - m.position.x) * 0.04;
    m.position.y += (my * 0.35 - m.position.y) * 0.04;

    // Pulsos de glitch aleatorios cada ~2-6 segundos
    if (t > glitchNext.current) {
      glitchPulse.current = 1.0;
      glitchNext.current = t + 2 + Math.random() * 4;
    }
    glitchPulse.current = Math.max(0, glitchPulse.current - delta * 3.5);

    mat.uTime = t;
    mat.uMouse.set(mx, my);
    mat.uGlitchAmount = glitchPulse.current * 0.6;
    mat.uDistort = 0.16 + Math.sin(t * 0.5) * 0.04;
  });

  return (
    <Float speed={1.0} rotationIntensity={0.2} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        {/* detail 24 instead of 64: ~7× fewer vertices, fbm shader runs per
            vertex so this is the single biggest perf win for the hero scene. */}
        <icosahedronGeometry args={[1.4, 24]} />
        <voidMaterial ref={matRef} />
      </mesh>
    </Float>
  );
}

// =============================================================
//  Rings — anillos delgados emisivos
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
//  TextCarousel — 3D interactive links
// =============================================================

function TextCarousel() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5;
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  
  const items = [
    { label: "WORKS", href: "/works", color: "#ff0040" },
    { label: "SIDEQUEST", href: "/sidequest", color: "#00fff0" },
    { label: "SHOP", href: "/shop", color: "#ffffff" },
    { label: "BIO", href: "/#about", color: "#ff0040" },
  ];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.2;
    const s = 1 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.015;
    groupRef.current.scale.set(s, s, s);
  });

  const handleNavigate = (href: string) => {
    window.location.href = href;
  };

  // Adjust radius and position based on viewport
  const radius = isMobile ? viewport.width * 0.35 : 1.6;
  const xOffset = isMobile ? 0 : viewport.width * 0.22;
  const yOffset = isMobile ? -viewport.height * 0.25 : 0;
  const fontSize = isMobile ? 0.25 : 0.32;

  return (
    <group ref={groupRef} position={[xOffset, yOffset, 0]}>
      {items.map((item, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <Text
            key={item.label}
            position={[x, (i - 1.5) * (isMobile ? 0.45 : 0.55), z]}
            rotation={[0, -angle + Math.PI / 2, 0]}
            fontSize={fontSize}
            font="https://fonts.gstatic.com/s/spacegrotesk/v13/V8mQoQDjQSkFtoMM3T6rjS3F9_P5S-AJJWC6.woff"
            color={hovered === item.label ? item.color : "#ffffff"}
            anchorX="center"
            anchorY="middle"
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(item.label);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = 'auto';
            }}
            onClick={() => handleNavigate(item.href)}
          >
            {item.label}
            <meshStandardMaterial 
              emissive={hovered === item.label ? item.color : "#111111"} 
              emissiveIntensity={hovered === item.label ? 6 : 0.5} 
              toneMapped={false}
              transparent
              opacity={0.9}
            />
          </Text>
        );
      })}
    </group>
  );
}

// =============================================================
//  Particles — nube de puntos que orbita lentamente
// =============================================================

function Particles({ count = 380 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spherical shell distribution between r=2.6 and r=6.
      const r = 2.6 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.5 + Math.random() * 2.5;
    }
    return { positions, sizes };
  }, [count]);

  useFrame((s, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.04;
    ref.current.rotation.x =
      Math.sin(s.clock.getElapsedTime() * 0.1) * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#ffffff"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// =============================================================
//  Scene3D — complete composition with post-FX.
// =============================================================

export default function Scene3D({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // `frameloop="never"` halts the render loop entirely → no shader work, no
  // postFX passes, no battery drain when the user has scrolled past the hero
  // or hidden the tab. Resumed via IntersectionObserver + visibilitychange.
  const [active, setActive] = useState(true);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    let inView = true;
    let pageVisible =
      typeof document !== "undefined" ? !document.hidden : true;
    const update = () => setActive(inView && pageVisible);

    const obs =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                inView = e.isIntersecting;
              }
              update();
            },
            { rootMargin: "100px 0px" },
          )
        : null;
    obs?.observe(node);

    const onVis = () => {
      pageVisible = !document.hidden;
      update();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      obs?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Reduced motion: skip the shader entirely, render a static gradient instead.
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
      <div
        className={className}
        style={{
          background:
            "radial-gradient(ellipse at center, #1a0205 0%, #000 60%)",
        }}
      />
    );
  }

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.25]}
        frameloop={active ? "always" : "never"}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 5, 12]} />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <GlitchOrb />
          <Rings />
          <Particles />
          <TextCarousel />
        </Suspense>

        {/* Trimmed postFX chain: Bloom + Glitch + Noise + Vignette.
            Removed ChromaticAberration (Glitch already does pixel splitting)
            and lowered Bloom radius to keep mipmap blur passes cheap. */}
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.22}
            luminanceSmoothing={0.65}
            mipmapBlur
            radius={0.55}
          />
          <Glitch
            delay={new THREE.Vector2(3.5, 8.0)}
            duration={new THREE.Vector2(0.05, 0.16)}
            strength={new THREE.Vector2(0.05, 0.15)}
            mode={GlitchMode.SPORADIC}
            ratio={0.85}
            active
          />
          <Noise opacity={0.04} premultiply blendFunction={BlendFunction.SCREEN} />
          <Vignette eskil={false} offset={0.22} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
