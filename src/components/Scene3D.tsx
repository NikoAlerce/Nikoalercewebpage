"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Text,
  useGLTF,
  useAnimations,
  shaderMaterial,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

// =============================================================
//  Holographic Halo Shader
// =============================================================

const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Add subtle liquid wave to vertices
    vec3 pos = position;
    float wave = sin(pos.x * 4.0 + uTime * 2.0) * cos(pos.y * 4.0 + uTime) * 0.05;
    pos += normal * wave;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const HALO_FRAG = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel effect
    float fresnel = dot(normal, viewDir);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 2.0);

    // Dynamic Iridescence pattern
    float pattern = sin(vUv.x * 20.0 + uTime * 3.0) * cos(vUv.y * 20.0 - uTime * 2.0);
    pattern = pattern * 0.5 + 0.5;

    // Mix vibrant colors
    vec3 color = mix(uColor1, uColor2, pattern + fresnel);
    
    // Boost glow at edges
    vec3 glow = color * fresnel * 2.5;
    
    gl_FragColor = vec4(color + glow, fresnel * 0.9 + 0.1);
  }
`;

const HolographicMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color("#00ffcc"), // Cyan
    uColor2: new THREE.Color("#ff0055"), // Magenta
  },
  HALO_VERTEX,
  HALO_FRAG,
  (mat) => {
    if (mat) {
      mat.transparent = true;
      mat.blending = THREE.AdditiveBlending;
      mat.depthWrite = false;
      mat.side = THREE.DoubleSide;
    }
  }
);

extend({ HolographicMaterial });

type HolographicMaterialImpl = THREE.ShaderMaterial & {
  uTime: number;
  uColor1: THREE.Color;
  uColor2: THREE.Color;
};

declare module "@react-three/fiber" {
  interface ThreeElements {
    holographicMaterial: import("@react-three/fiber").Object3DNode<HolographicMaterialImpl, typeof HolographicMaterial>;
  }
}

function HolographicHalo() {
  const matRef = useRef<HolographicMaterialImpl>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uTime = state.clock.getElapsedTime();
    }
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.15;
      meshRef.current.rotation.y = Math.cos(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={0}>
      {/* A complex torus knot to act as an energy halo behind/around the GLB */}
      <torusKnotGeometry args={[1.8, 0.08, 200, 32, 3, 4]} />
      <holographicMaterial ref={matRef} />
    </mesh>
  );
}

// =============================================================
//  Subtle Dust Particles (Vibrant Accents)
// =============================================================

function ReactiveParticles({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const mouseTarget = useRef(new THREE.Vector2(0, 0));

  const basePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 5.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  const positions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  // Vibrant particle colors
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c1 = new THREE.Color("#00ffcc");
    const c2 = new THREE.Color("#ff0055");
    const c3 = new THREE.Color("#7000ff");
    const pal = [c1, c2, c3];
    for (let i = 0; i < count; i++) {
      const c = pal[Math.floor(Math.random() * pal.length)];
      arr[i * 3 + 0] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [count]);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const mx = state.mouse.x;
    const my = state.mouse.y;
    mouseTarget.current.x += (mx - mouseTarget.current.x) * 0.05;
    mouseTarget.current.y += (my - mouseTarget.current.y) * 0.05;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      const dx = bx - mouseTarget.current.x * 4;
      const dy = by - mouseTarget.current.y * 4;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repel = Math.max(0, 1 - dist / 3.0);
      const pushX = repel * dx * 0.8;
      const pushY = repel * dy * 0.8;
      const drift = Math.sin(t * 0.5 + i * 0.1) * 0.1;
      posAttr.setXYZ(
        i,
        bx + pushX + drift,
        by + pushY + Math.cos(t * 0.3 + i * 0.05) * 0.1,
        bz + Math.sin(t * 0.2 + i * 0.07) * 0.1,
      );
    }
    posAttr.needsUpdate = true;
    ref.current.rotation.y += dt * 0.04;
    ref.current.rotation.x = Math.sin(t * 0.1) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
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
//  CapturedGLB — The True Star of the Scene
// =============================================================

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
function ipfsToHttp(uri: string): string {
  if (uri.startsWith("http")) return uri;
  if (uri.startsWith("ipfs://")) return `${IPFS_GATEWAY}${uri.replace("ipfs://", "")}`;
  return uri;
}

function InnerModel({ url }: { url: string }) {
  const { scene, animations } = useGLTF(url);
  const cloned = useMemo(() => cloneSkeleton(scene as THREE.Object3D), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, groupRef);

  // Normalize scale to fit nicely in the center
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;
    const ns = 2.4 / maxDim; // Larger scale to make it the absolute focal point
    return { offset: center.clone().multiplyScalar(-ns), scale: ns };
  }, [cloned]);

  useEffect(() => {
    if (!actions || names.length === 0) return;
    for (const name of names) {
      const action = actions[name];
      if (action) {
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
    }
    return () => { Object.values(actions).forEach((a) => a?.stop()); };
  }, [actions, names]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    // Elegant, slow rotation to showcase the model
    groupRef.current.rotation.y += dt * 0.15;
    
    // Smooth floating effect
    groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.1;
  });

  return (
    <group ref={groupRef} renderOrder={1}>
      <primitive
        object={cloned}
        position={transform.offset.toArray()}
        scale={transform.scale}
      />
    </group>
  );
}

function CapturedGLB({ urls }: { urls: string[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const httpUrls = useMemo(() => urls.map(ipfsToHttp), [urls]);

  useEffect(() => {
    if (httpUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % httpUrls.length);
    }, 20000); // Swaps every 20 seconds
    return () => clearInterval(interval);
  }, [httpUrls.length]);

  if (httpUrls.length === 0) return null;
  const currentUrl = httpUrls[currentIdx];

  return (
    <Suspense fallback={null}>
      <InnerModel key={currentUrl} url={currentUrl} />
    </Suspense>
  );
}

// =============================================================
//  TextCarousel — Small, elegant, easily clickable
// =============================================================

interface CarouselItemProps {
  label: string;
  tag: string;
  href: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  fontSize: number;
  onNavigate: (href: string) => void;
}

function CarouselItem({ label, tag, href, color, position, rotation, fontSize, onNavigate }: CarouselItemProps) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_state, delta) => {
    if (!matRef.current) return;
    const targetEmissive = hovered ? 3.0 : 0.0;
    matRef.current.emissiveIntensity += (targetEmissive - matRef.current.emissiveIntensity) * delta * 8;
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      onClick={() => onNavigate(href)}
    >
      {/* Invisible hitbox - huge compared to text for easy clicking */}
      <mesh visible={false}>
        <planeGeometry args={[2.5, 1.0]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Text
        fontSize={fontSize}
        letterSpacing={0.6} // High tracking for editorial/tech feel
        anchorX="center"
        anchorY="middle"
      >
        {label}
        <meshStandardMaterial
          ref={matRef}
          color="#ffffff"
          emissive={color}
          emissiveIntensity={0.0}
          toneMapped={false}
        />
      </Text>

      <Text
        position={[0, -fontSize * 1.5, 0]}
        fontSize={fontSize * 0.3}
        letterSpacing={0.8}
        anchorX="center"
        anchorY="middle"
      >
        {tag}
        <meshBasicMaterial color={hovered ? color : "#555555"} toneMapped={false} />
      </Text>
    </group>
  );
}

function TextCarousel() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5;
  const groupRef = useRef<THREE.Group>(null);
  const rotationY = useRef(0);

  const items = [
    { label: "WORKS", tag: "001_GALLERY", href: "/works", color: "#00ffcc" },
    { label: "SIDEQUEST", tag: "002_ALTER_EGO", href: "/sidequest", color: "#ff0055" },
    { label: "BIO", tag: "003_IDENTITY", href: "/#about", color: "#7000ff" },
    { label: "CONTACT", tag: "004_CONNECT", href: "/#about", color: "#ffcc00" },
  ];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const mouseInfluence = state.mouse.x * 0.5;
    rotationY.current += delta * (0.04 + mouseInfluence);
    groupRef.current.rotation.y = rotationY.current;
    
    // Slanted orbit like Saturn's rings
    groupRef.current.rotation.x = Math.PI / 8 + (state.mouse.y * 0.1);
  });

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith("/#")) {
      const el = document.getElementById(href.slice(2));
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    window.location.href = href;
  }, []);

  // Radius is large, but text is very small
  const radius = isMobile ? 2.4 : 3.2;
  const fontSize = isMobile ? 0.12 : 0.16;

  return (
    <group ref={groupRef}>
      {items.map((item, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        return (
          <Suspense key={item.label} fallback={null}>
            <CarouselItem
              label={item.label}
              tag={item.tag}
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
//  CenterGroup — Lighting and Composition
// =============================================================

function OrbitingLights() {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  const light3 = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (light1.current) {
      light1.current.position.set(Math.cos(t * 0.8) * 3, Math.sin(t * 0.5) * 2, Math.sin(t * 0.8) * 3);
    }
    if (light2.current) {
      light2.current.position.set(Math.cos(-t * 0.6 + 2) * 3, Math.sin(-t * 0.4 + 1) * 2, Math.sin(-t * 0.6 + 2) * 3);
    }
    if (light3.current) {
      light3.current.position.set(Math.cos(t * 0.4 + 4) * 2, Math.sin(t * 0.7 + 3) * 3, Math.sin(t * 0.4 + 4) * 2);
    }
  });

  return (
    <>
      <pointLight ref={light1} color="#00ffcc" intensity={2.0} distance={10} decay={2} />
      <pointLight ref={light2} color="#ff0055" intensity={2.0} distance={10} decay={2} />
      <pointLight ref={light3} color="#7000ff" intensity={1.5} distance={10} decay={2} />
    </>
  );
}

function CenterGroup({ glbUrls }: { glbUrls: string[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.x += (state.mouse.x * 0.2 - groupRef.current.position.x) * 0.05;
    groupRef.current.position.y += (state.mouse.y * 0.15 - groupRef.current.position.y) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <OrbitingLights />
      <CapturedGLB urls={glbUrls} />
      <HolographicHalo />
    </group>
  );
}

// =============================================================
//  Scene3D — main entry
// =============================================================

export default function Scene3D({
  className,
  glbUrls = [],
}: {
  className?: string;
  glbUrls?: string[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

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
      <div className={className} style={{ background: "#000000" }} />
    );
  }

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "never"}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 6, 15]} />

        {/* Base Studio Lighting for GLB Details */}
        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-3, -2, 2]} intensity={0.5} color="#ffffff" />

        <Suspense fallback={null}>
          <Environment preset="studio" />
          <CenterGroup glbUrls={glbUrls} />
        </Suspense>

        <ReactiveParticles count={400} />
        <TextCarousel />

        <EffectComposer multisampling={4}>
          <Bloom intensity={0.8} luminanceThreshold={0.4} luminanceSmoothing={0.9} mipmapBlur radius={0.6} />
          <Noise opacity={0.03} premultiply blendFunction={BlendFunction.SCREEN} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
