"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Text,
  useGLTF,
  useAnimations,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

// =============================================================
//  EnergyIcosahedron — MoMA aesthetic (glass/crystal)
// =============================================================

function EnergyIcosahedron() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.getElapsedTime();
    m.rotation.x = t * 0.05;
    m.rotation.y = t * 0.08;
    
    if (wireRef.current) {
      wireRef.current.rotation.copy(m.rotation);
    }
  });

  return (
    <group renderOrder={10}>
      <mesh ref={meshRef}>
        {/* Sharp edges with 0 detail */}
        <icosahedronGeometry args={[1.6, 0]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1}
          opacity={1}
          transparent
          roughness={0.15}
          metalness={0.1}
          thickness={1.5}
          ior={1.4}
          clearcoat={1}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Subtle structural wireframe */}
      <lineSegments ref={wireRef}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(1.6, 0)]} />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

// =============================================================
//  Rings
// =============================================================

function Rings() {
  const group = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!group.current) return;
    group.current.rotation.z += dt * 0.03;
    group.current.rotation.x = Math.sin(s.clock.getElapsedTime() * 0.1) * 0.05;
  });
  return (
    <group ref={group}>
      {[2.2, 2.7, 3.2, 3.8].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2 + i * 0.1, i * 0.2, i]}>
          <torusGeometry args={[r, 0.0015, 16, 200]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.08 - i * 0.015}
          />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================
//  ReactiveParticles — subtle minimal dust
// =============================================================

function ReactiveParticles({ count = 400 }: { count?: number }) {
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
      const dx = bx - mouseTarget.current.x * 3;
      const dy = by - mouseTarget.current.y * 3;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repel = Math.max(0, 1 - dist / 2.5);
      const pushX = repel * dx * 0.6;
      const pushY = repel * dy * 0.6;
      const drift = Math.sin(t * 0.5 + i * 0.1) * 0.08;
      posAttr.setXYZ(
        i,
        bx + pushX + drift,
        by + pushY + Math.cos(t * 0.3 + i * 0.05) * 0.05,
        bz + Math.sin(t * 0.2 + i * 0.07) * 0.06,
      );
    }
    posAttr.needsUpdate = true;
    ref.current.rotation.y += dt * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// =============================================================
//  CapturedGLB — Inside the icosahedron
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

  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;
    const ns = 2.0 / maxDim; // Fit nicely inside the 1.6 radius
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
    groupRef.current.rotation.y += dt * 0.25;
    groupRef.current.rotation.x += (state.mouse.y * 0.15 - groupRef.current.rotation.x) * 0.03;
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
    }, 30000);
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
//  TextCarousel — sleek, editorial, high-end
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
    const targetEmissive = hovered ? 1.5 : 0.1;
    matRef.current.emissiveIntensity += (targetEmissive - matRef.current.emissiveIntensity) * delta * 5;
    const targetOpacity = hovered ? 1.0 : 0.6;
    matRef.current.opacity += (targetOpacity - matRef.current.opacity) * delta * 5;
  });

  return (
    <Float speed={1.0} rotationIntensity={0} floatIntensity={0.05}>
      <group
        position={position}
        rotation={rotation}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        onClick={() => onNavigate(href)}
      >
        <Text
          fontSize={fontSize}
          letterSpacing={0.3}
          anchorX="center"
          anchorY="middle"
        >
          {label}
          <meshStandardMaterial
            ref={matRef}
            color="#ffffff"
            emissive={color}
            emissiveIntensity={0.1}
            toneMapped={false}
            transparent
            opacity={0.6}
          />
        </Text>

        <Text
          position={[0, -fontSize * 0.75, 0]}
          fontSize={fontSize * 0.16}
          letterSpacing={0.4}
          anchorX="center"
          anchorY="middle"
        >
          {tag}
          <meshBasicMaterial color={color} transparent opacity={hovered ? 0.7 : 0.3} toneMapped={false} />
        </Text>
      </group>
    </Float>
  );
}

function TextCarousel() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5;
  const groupRef = useRef<THREE.Group>(null);
  const rotationY = useRef(0);

  const items = [
    { label: "WORKS", tag: "001_GALLERY", href: "/works", color: "#ffffff" },
    { label: "SIDEQUEST", tag: "002_ALTER_EGO", href: "/sidequest", color: "#e0e0e0" },
    { label: "BIO", tag: "003_IDENTITY", href: "/#about", color: "#cccccc" },
    { label: "CONTACT", tag: "004_CONNECT", href: "/#about", color: "#a0a0a0" },
  ];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const mouseInfluence = state.mouse.x * 0.8;
    rotationY.current += delta * (0.05 + mouseInfluence);
    groupRef.current.rotation.y = rotationY.current;
    groupRef.current.rotation.x += (state.mouse.y * 0.15 - groupRef.current.rotation.x) * 0.08;
  });

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith("/#")) {
      const el = document.getElementById(href.slice(2));
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    window.location.href = href;
  }, []);

  const radius = isMobile ? 2.2 : 2.8;
  const fontSize = isMobile ? 0.2 : 0.28;

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
  const whiteRef1 = useRef<THREE.PointLight>(null);
  const whiteRef2 = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (whiteRef1.current) {
      whiteRef1.current.position.set(
        Math.cos(t * 0.3) * 2.5,
        Math.sin(t * 0.5) * 1.5,
        Math.sin(t * 0.3) * 2.5,
      );
    }
    if (whiteRef2.current) {
      whiteRef2.current.position.set(
        Math.cos(-t * 0.2 + 2) * 2.8,
        Math.sin(-t * 0.4 + 1) * 1.0,
        Math.sin(-t * 0.2 + 2) * 2.8,
      );
    }
  });

  return (
    <>
      <pointLight ref={whiteRef1} color="#ffffff" intensity={0.8} distance={8} decay={2} />
      <pointLight ref={whiteRef2} color="#e0e0e0" intensity={0.6} distance={8} decay={2} />
    </>
  );
}

function CenterGroup({ glbUrls }: { glbUrls: string[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.x += (state.mouse.x * 0.3 - groupRef.current.position.x) * 0.04;
    groupRef.current.position.y += (state.mouse.y * 0.2 - groupRef.current.position.y) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <OrbitingLights />
      <CapturedGLB urls={glbUrls} />
      <EnergyIcosahedron />
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
      <div className={className} style={{ background: "#0a0a0a" }} />
    );
  }

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "never"}
      >
        <color attach="background" args={["#080808"]} />
        <fog attach="fog" args={["#080808", 6, 16]} />

        {/* Elegant studio lighting */}
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-3, -2, 2]} intensity={0.5} color="#a0a0a0" />
        <pointLight position={[0, 0, -3]} intensity={1.0} color="#ffffff" distance={8} decay={2} />

        <Suspense fallback={null}>
          <Environment preset="studio" />
          <CenterGroup glbUrls={glbUrls} />
          <Rings />
        </Suspense>

        <ReactiveParticles count={300} />
        <TextCarousel />

        <EffectComposer multisampling={4}>
          <Bloom intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur radius={0.5} />
          <Noise opacity={0.04} premultiply blendFunction={BlendFunction.SCREEN} />
          <Vignette eskil={false} offset={0.3} darkness={0.8} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
