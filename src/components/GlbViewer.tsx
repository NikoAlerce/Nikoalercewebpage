"use client";

import {
  Suspense,
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  useAnimations,
  PerspectiveCamera,
  useProgress,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { IPFS_GATEWAYS, ipfsWithGateway } from "@/lib/objkt";

type Hdri =
  | "studio"
  | "city"
  | "warehouse"
  | "sunset"
  | "dawn"
  | "night"
  | "apartment"
  | "park"
  | "lobby"
  | "forest";

type BgMode = "void" | "neutral" | "white" | "hdri";

const HDRI_OPTS: { value: Hdri; label: string }[] = [
  { value: "studio", label: "STUDIO" },
  { value: "city", label: "CITY" },
  { value: "warehouse", label: "WAREHOUSE" },
  { value: "sunset", label: "SUNSET" },
  { value: "dawn", label: "DAWN" },
  { value: "night", label: "NIGHT" },
  { value: "apartment", label: "APT" },
  { value: "park", label: "PARK" },
  { value: "lobby", label: "LOBBY" },
  { value: "forest", label: "FOREST" },
];

const BG_OPTS: { value: BgMode; label: string }[] = [
  { value: "void", label: "VOID" },
  { value: "neutral", label: "GRAY" },
  { value: "white", label: "WHITE" },
  { value: "hdri", label: "HDRI" },
];

type ModelInfo = {
  triangles: number;
  meshes: number;
  bottomY: number;
  size: { x: number; y: number; z: number };
};

/**
 * Loads the GLB, centers it, and normalizes it to [-1, 1] by the largest dimension.
 * Plays ALL embedded animations (or a specific one if the user selects it).
 * NO toca los materiales del autor (envMapIntensity, colors, maps) salvo wireframe.
 */
function Model({
  url,
  autoRotate,
  selectedAnim,
  playing,
  wireframe,
  speed,
  onReady,
}: {
  url: string;
  autoRotate: boolean;
  selectedAnim: string | "__all__" | null;
  playing: boolean;
  wireframe: boolean;
  speed: number;
  onReady: (info: ModelInfo, animationNames: string[]) => void;
}) {
  const { scene, animations } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Clonamos preservando bones/skeleton para que cada apertura del modal
  // arranque desde un estado limpio (useGLTF cachea la escena).
  const cloned = useMemo<THREE.Object3D>(
    () => cloneSkeleton(scene as THREE.Object3D),
    [scene],
  );

  // useAnimations clona internamente y devuelve actions enlazadas a groupRef
  const { actions, names } = useAnimations(animations, groupRef);

  // Bounding box → centrado y escala al cargar
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;
    const ns = 2 / maxDim;

    let triangles = 0;
    let meshes = 0;
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshes++;
        const geom = obj.geometry as THREE.BufferGeometry | undefined;
        if (geom) {
          if (geom.index) triangles += geom.index.count / 3;
          else if (geom.attributes.position)
            triangles += geom.attributes.position.count / 3;
        }
        obj.castShadow = false;
        obj.receiveShadow = false;
        obj.frustumCulled = false;
      }
    });

    return {
      offset: center.clone().multiplyScalar(-ns),
      scale: ns,
      bottomY: -(sz.y * ns) / 2 - 0.001,
      info: {
        triangles: Math.round(triangles),
        meshes,
        bottomY: -(sz.y * ns) / 2 - 0.001,
        size: {
          x: sz.x * ns,
          y: sz.y * ns,
          z: sz.z * ns,
        },
      } as ModelInfo,
    };
  }, [cloned]);

  // Wireframe toggle (preserves the rest of the material props).
  useEffect(() => {
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m && "wireframe" in m) {
            (m as THREE.MeshStandardMaterial).wireframe = wireframe;
          }
        }
      }
    });
  }, [cloned, wireframe]);

  // Reportar info + animaciones una vez calculadas
  useEffect(() => {
    onReady(transform.info, names);
  }, [transform.info, names, onReady]);

  // Play GLB animations.
  useEffect(() => {
    if (!actions) return;
    // Detener todas
    Object.values(actions).forEach((a) => a?.stop());
    if (names.length === 0) return;

    const targets =
      selectedAnim && selectedAnim !== "__all__" ? [selectedAnim] : names;

    for (const name of targets) {
      const action = actions[name];
      if (action) {
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.timeScale = speed;
        action.play();
        action.paused = !playing;
      }
    }
  }, [actions, names, selectedAnim, playing, speed]);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={cloned}
        position={transform.offset.toArray()}
        scale={transform.scale}
      />
    </group>
  );
}

/**
 * Sets scene.environmentIntensity dynamically (Three r155+).
 * Allows the user to control how much the HDRI lights the model without touching materials.
 */
function EnvIntensity({ value }: { value: number }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    // Three.js 0.155+: scene.environmentIntensity
    (scene as unknown as { environmentIntensity: number }).environmentIntensity =
      value;
  }, [scene, value]);
  return null;
}

function Exposure({ value }: { value: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = value;
  }, [gl, value]);
  return null;
}

function Stats({
  onUpdate,
}: {
  onUpdate: (s: { fps: number; calls: number; tris: number }) => void;
}) {
  const gl = useThree((s) => s.gl);
  const ref = useRef({ time: performance.now(), frames: 0 });

  useFrame(() => {
    ref.current.frames++;
    const now = performance.now();
    const dt = now - ref.current.time;
    if (dt >= 500) {
      onUpdate({
        fps: Math.round((ref.current.frames * 1000) / dt),
        calls: gl.info.render.calls,
        tris: gl.info.render.triangles,
      });
      ref.current.frames = 0;
      ref.current.time = now;
    }
  });
  return null;
}

function Loader() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="absolute inset-0 grid place-items-center pointer-events-none bg-void/40 z-10">
      <div className="text-center">
        <div className="text-[10px] tracking-[0.4em] text-glitch-cyan animate-pulse mb-3">
          DECODING GEOMETRY · {progress.toFixed(0)}%
        </div>
        <div className="w-64 h-px bg-white/10 mx-auto relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-glitch-cyan transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function GlbViewer({ url }: { url: string }) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [bloom, setBloom] = useState(false);
  const [hdri, setHdri] = useState<Hdri>("city");
  const [bg, setBg] = useState<BgMode>("void");
  const [exposure, setExposure] = useState(1.0);
  const [envIntensity, setEnvIntensity] = useState(1.0);
  const [wireframe, setWireframe] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(1.0);

  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [hardError, setHardError] = useState(false);
  const [animations, setAnimations] = useState<string[]>([]);
  const [selectedAnim, setSelectedAnim] = useState<string | "__all__">("__all__");
  const [playing, setPlaying] = useState(true);
  const [stats, setStats] = useState({ fps: 0, calls: 0, tris: 0 });
  const [info, setInfo] = useState<ModelInfo>({
    triangles: 0,
    meshes: 0,
    bottomY: -1,
    size: { x: 0, y: 0, z: 0 },
  });
  const [resetKey, setResetKey] = useState(0);

  const resolvedUrl = useMemo(() => {
    if (url.startsWith("http")) return url;
    if (url.startsWith("ipfs://")) return ipfsWithGateway(url, gatewayIdx)!;
    return url;
  }, [url, gatewayIdx]);

  // Si demora demasiado en cargar, probar otro IPFS gateway
  const ready = info.size.y > 0;
  useEffect(() => {
    if (ready || hardError) return;
    const t = setTimeout(() => {
      if (gatewayIdx < IPFS_GATEWAYS.length - 1) {
        setGatewayIdx((i) => i + 1);
      } else {
        setHardError(true);
      }
    }, 30000);
    return () => clearTimeout(t);
  }, [resolvedUrl, ready, hardError, gatewayIdx]);

  // Reset metadata cuando cambia la URL del modelo
  useEffect(() => {
    setAnimations([]);
    setSelectedAnim("__all__");
    setInfo({ triangles: 0, meshes: 0, bottomY: -1, size: { x: 0, y: 0, z: 0 } });
  }, [resolvedUrl]);

  const handleReady = useCallback((i: ModelInfo, names: string[]) => {
    setInfo(i);
    setAnimations(names);
  }, []);

  const bgColor = useMemo(() => {
    if (bg === "void") return "#000000";
    if (bg === "neutral") return "#1a1a1a";
    if (bg === "white") return "#e8e8e8";
    return null;
  }, [bg]);

  const isLightBg = bg === "white";

  return (
    <div className="relative w-full h-full bg-void overflow-hidden">
      <Canvas
        key={resolvedUrl + "_" + resetKey}
        dpr={[1, 2]}
        shadows={false}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: exposure,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        {bgColor && <color attach="background" args={[bgColor]} />}
        <PerspectiveCamera
          makeDefault
          position={[2.4, 1.4, 3.4]}
          fov={36}
          near={0.01}
          far={500}
        />

        <Exposure value={exposure} />
        <EnvIntensity value={envIntensity} />
        <Stats onUpdate={setStats} />

        <Suspense fallback={null}>
          <Model
            url={resolvedUrl}
            autoRotate={autoRotate}
            selectedAnim={selectedAnim}
            playing={playing}
            wireframe={wireframe}
            speed={animSpeed}
            onReady={handleReady}
          />
          <Environment
            preset={hdri}
            background={bg === "hdri"}
            backgroundBlurriness={bg === "hdri" ? 0.35 : 0}
          />
          <ContactShadows
            position={[0, info.bottomY ?? -1, 0]}
            opacity={isLightBg ? 0.55 : 0.65}
            scale={Math.max(8, (info.size.x + info.size.z) * 4)}
            blur={2.6}
            far={4}
            resolution={2048}
            color="#000000"
          />
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableDamping
          dampingFactor={0.08}
          minDistance={0.6}
          maxDistance={25}
          target={[0, 0, 0]}
          makeDefault
        />

        {/* Bloom solo si el usuario lo activa. Sin tonemapping pass extra
            (el tonemap lo hace el renderer con ACES + exposure). */}
        <EffectComposer enabled={bloom} multisampling={4}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.65}
            luminanceSmoothing={0.7}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <Loader />

      {hardError && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center text-glitch-red text-xs tracking-[0.3em]">
            ERROR :: NO SE PUDO CARGAR EL MODELO
          </div>
        </div>
      )}

      {/* Top-left: meta */}
      <div className="absolute top-3 left-3 text-[9px] tracking-[0.4em] text-ash/70 pointer-events-none font-mono">
        // 3D · {info.triangles.toLocaleString()} TRI · {info.meshes} MESH
        {animations.length > 0 && (
          <>
            {" · "}
            <span className="text-glitch-cyan">
              {animations.length} ANIM
            </span>
          </>
        )}
      </div>

      {/* Top-right: live stats */}
      <div className="absolute top-3 right-3 text-[9px] tracking-[0.3em] text-ash/60 font-mono text-right pointer-events-none leading-relaxed">
        <div>
          FPS{" "}
          <span className={stats.fps >= 50 ? "text-glitch-lime" : "text-bone"}>
            {String(stats.fps).padStart(3, " ")}
          </span>
        </div>
        <div>CALLS {stats.calls}</div>
        <div>DRAW {stats.tris.toLocaleString()}</div>
      </div>

      {/* Hint controls */}
      <div className="absolute top-12 left-3 text-[9px] tracking-[0.4em] text-ash/40 pointer-events-none">
        DRAG · ZOOM · ORBIT
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2 pointer-events-none">
        {/* Playback row (only when animations exist) */}
        {animations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-[0.3em] pointer-events-auto">
            <button
              onClick={() => setPlaying((v) => !v)}
              className={
                "px-3 py-1.5 border bg-void/70 backdrop-blur-sm transition-colors " +
                (playing
                  ? "border-glitch-cyan text-glitch-cyan"
                  : "border-white/15 text-ash hover:border-glitch-cyan hover:text-glitch-cyan")
              }
              title={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? "⏸ PAUSE" : "▶ PLAY"}
            </button>

            {animations.length > 1 ? (
              <select
                value={selectedAnim}
                onChange={(e) => setSelectedAnim(e.target.value as Hdri)}
                className="px-3 py-1.5 border border-white/15 bg-void/70 backdrop-blur-sm text-ash hover:border-bone uppercase tracking-[0.3em] outline-none cursor-pointer"
              >
                <option value="__all__">ALL ({animations.length})</option>
                {animations.map((n) => (
                  <option key={n} value={n}>
                    {n.toUpperCase().slice(0, 24)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-3 py-1.5 border border-white/15 bg-void/70 backdrop-blur-sm text-ash/60 uppercase tracking-[0.3em]">
                {animations[0]?.slice(0, 24) ?? ""}
              </span>
            )}

            <Slider
              label="SPEED"
              value={animSpeed}
              min={0.1}
              max={3}
              step={0.05}
              onChange={setAnimSpeed}
              digits={2}
            />
          </div>
        )}

        {/* Lighting row */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-[0.3em] pointer-events-auto">
          <select
            value={hdri}
            onChange={(e) => setHdri(e.target.value as Hdri)}
            className="px-3 py-1.5 border border-white/15 bg-void/70 backdrop-blur-sm text-ash hover:border-bone uppercase tracking-[0.3em] outline-none cursor-pointer"
            title="HDRI lighting preset"
          >
            {HDRI_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                HDRI · {o.label}
              </option>
            ))}
          </select>
          <select
            value={bg}
            onChange={(e) => setBg(e.target.value as BgMode)}
            className="px-3 py-1.5 border border-white/15 bg-void/70 backdrop-blur-sm text-ash hover:border-bone uppercase tracking-[0.3em] outline-none cursor-pointer"
            title="Background color"
          >
            {BG_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                BG · {o.label}
              </option>
            ))}
          </select>

          <Slider
            label="EXP"
            value={exposure}
            min={0.2}
            max={2}
            step={0.05}
            onChange={setExposure}
            digits={2}
            title="Tone mapping exposure (ACES Filmic)"
          />
          <Slider
            label="IBL"
            value={envIntensity}
            min={0}
            max={2.5}
            step={0.05}
            onChange={setEnvIntensity}
            digits={2}
            title="HDRI intensity over the materials"
          />
        </div>

        {/* View row */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-[0.3em] pointer-events-auto">
          <ToggleBtn
            on={autoRotate}
            label="ROTATE"
            onClick={() => setAutoRotate((v) => !v)}
          />
          <ToggleBtn
            on={wireframe}
            label="WIRE"
            onClick={() => setWireframe((v) => !v)}
          />
          <ToggleBtn
            on={bloom}
            label="BLOOM"
            color="red"
            onClick={() => setBloom((v) => !v)}
          />
          <button
            onClick={() => setResetKey((k) => k + 1)}
            className="px-3 py-1.5 border border-white/15 bg-void/70 backdrop-blur-sm text-ash hover:border-bone hover:text-bone"
            title="Reset camera and state"
          >
            ⟲ RESET
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleBtn({
  on,
  label,
  color = "cyan",
  onClick,
}: {
  on: boolean;
  label: string;
  color?: "cyan" | "red";
  onClick: () => void;
}) {
  const onCls =
    color === "red"
      ? "border-glitch-red text-glitch-red"
      : "border-bone text-bone";
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 border bg-void/70 backdrop-blur-sm transition-colors " +
        (on ? onCls : "border-white/15 text-ash hover:border-bone")
      }
    >
      {label}: {on ? "ON" : "OFF"}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  digits = 2,
  title,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  digits?: number;
  title?: string;
}) {
  return (
    <label
      title={title}
      className="flex items-center gap-2 px-3 py-1.5 border border-white/15 bg-void/70 backdrop-blur-sm cursor-pointer"
    >
      <span className="text-ash/70">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 accent-glitch-cyan cursor-pointer"
      />
      <span className="text-bone font-mono w-9 text-right">
        {value.toFixed(digits)}
      </span>
    </label>
  );
}
