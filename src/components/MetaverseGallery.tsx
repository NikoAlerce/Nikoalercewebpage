"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { useTokenViewer } from "./TokenViewerContext";
import { playClickSound, playUnlockSound, playCollectSound } from "@/lib/sound";
import PlayerControls, { PlayerControlsRef } from "./PlayerControls";
import GalleryScene from "./GalleryScene";
import NftFrame from "./NftFrame";
import MeshScreen from "./MeshScreen";
import type { ObjktToken } from "@/lib/types";
import { lowestPriceXtz, isDisplayableToken, detectKind, ipfsToUrl } from "@/lib/objkt";

// ============================================================
// Frame positions for nuevagalery.glb — auto-extracted from the painting
// UV-islands in the model (world position, facing rotation, and the real
// width/height of each painting so the artwork covers it exactly).
// ============================================================
const FRAME_SPOTS: { pos: [number, number, number]; rotY: number; w: number; h: number; curved?: boolean; slots?: number }[] = [
  { pos: [-6.21, 1.45, -6.52], rotY: -1.5842, w: 4.01, h: 2 },
  { pos: [6.06, 1.48, -6.46], rotY: -1.5708, w: 2, h: 2 },
  { pos: [6.06, 1.48, -8.02], rotY: -1.5708, w: 0.86, h: 2 },
  { pos: [6.06, 2.02, -8.96], rotY: -1.5708, w: 0.86, h: 0.92 },
  { pos: [6.06, 0.97, -8.96], rotY: -1.5708, w: 0.86, h: 0.98 },
  { pos: [9.57, 1.44, 0.09], rotY: -1.5898, w: 2, h: 2 },
  { pos: [-10.71, 1.79, -2.08], rotY: 0.0555, w: 2, h: 2 }, // rotY flipped +π (was facing wall)
  { pos: [-31.79, 1.59, -5.68], rotY: -0.0254, w: 2, h: 2 },
  { pos: [-28.86, 1.59, -5.68], rotY: -0.0035, w: 2, h: 2 },
  { pos: [-26.03, 1.59, -5.63], rotY: -0.0035, w: 2, h: 2 },
  { pos: [-21.8, 1.67, -9.06], rotY: 0.5964, w: 0.77, h: 2.45, slots: 3 },
  { pos: [-20.35, 1.67, -9.5], rotY: 0.1091, w: 0.77, h: 2.45, slots: 3 },
  { pos: [-18.93, 2.51, -9.36], rotY: -0.4029, w: 0.77, h: 0.77 },
  { pos: [-17.93, 2.51, -8.68], rotY: -0.7806, w: 0.77, h: 0.77 },
  { pos: [-17.1, 2.51, -7.39], rotY: -1.2321, w: 0.77, h: 0.77 }, // rotY flipped +π
  { pos: [-22.82, 1.67, -7.57], rotY: 1.1442, w: 0.77, h: 2.45, slots: 3 },
  { pos: [-18.93, 1.68, -9.36], rotY: -0.4029, w: 0.77, h: 0.77 },
  { pos: [-18.93, 0.83, -9.36], rotY: -0.4029, w: 0.77, h: 0.77 },
  { pos: [-17.93, 1.64, -8.68], rotY: -0.7806, w: 0.77, h: 0.77 },
  { pos: [-17.1, 1.64, -7.39], rotY: 1.9095, w: 0.77, h: 0.77 },
  { pos: [-17.93, 0.77, -8.68], rotY: -0.7806, w: 0.77, h: 0.77 },
  { pos: [-17.1, 0.77, -7.39], rotY: 1.9095, w: 0.77, h: 0.77 },
  { pos: [-15.39, 1.56, -5.82], rotY: -0.0533, w: 0.77, h: 1.94, slots: 3 },
  { pos: [-13.98, 1.56, -5.43], rotY: -0.5396, w: 0.77, h: 1.94, slots: 3 },
  { pos: [-12.6, 1.56, -3.28], rotY: -1.467, w: 0.77, h: 1.94, slots: 3 },
  { pos: [7.76, 1.43, -2.82], rotY: -0.3538, w: 1.83, h: 1.83 },
  { pos: [-20.25, 1.61, 9.32], rotY: 2.1694, w: 3.67, h: 2.66, curved: true }, // Dancer N|4 — curved screen
  { pos: [7.49, 1.44, 2.86], rotY: -2.813, w: 2, h: 2 },
  { pos: [-10.77, 1.79, 2.24], rotY: -3.1396, w: 2, h: 2 },
  { pos: [-15.05, 1.58, 6.06], rotY: -2.9577, w: 2, h: 2 },
  { pos: [-25.73, 1.59, 6.23], rotY: 3.1162, w: 2, h: 2 },
  { pos: [-28.44, 1.59, 6.19], rotY: 3.1162, w: 2, h: 2 },
  { pos: [-30.97, 1.59, 6.12], rotY: 3.1162, w: 2, h: 2 },
  { pos: [-12.54, 1.56, 3.5], rotY: -1.5817, w: 0.77, h: 1.94, slots: 3 },
  { pos: [-6.11, 1.45, -11.92], rotY: 1.5611, w: 2.61, h: 2 }, // rotY flipped +π
  { pos: [-6.14, 1.45, -9.56], rotY: 1.5526, w: 1.38, h: 2 }, // rotY flipped +π
];

// Player starts in the middle of the gallery floor (flat, y=0).
const PLAYER_START = new THREE.Vector3(-15, 0.0, 0);

// ──────────────────────────────────────────────
// Loading overlay (inside Canvas via Html)
// ──────────────────────────────────────────────
function LoadingOverlay() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-6 font-mono">
        <div className="text-[10px] tracking-[0.6em] text-cyan-400 animate-pulse">
          DECODING_3D_ENVIRONMENT · {Math.round(progress)}%
        </div>
        <div className="w-64 h-px bg-white/10 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-cyan-400 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[9px] tracking-[0.3em] text-white/30">
          nuevagalery.glb · {FRAME_SPOTS.length} FRAMES
        </div>
      </div>
    </Html>
  );
}

// ──────────────────────────────────────────────
// Perf probe — samples FPS + draw calls + triangles (gl.info) twice a second.
// ──────────────────────────────────────────────
function PerfProbe({ onStats }: { onStats: (s: { fps: number; calls: number; tris: number }) => void }) {
  const { gl } = useThree();
  const last = useRef(performance.now());
  const frames = useRef(0);
  const acc = useRef(0);
  useFrame(() => {
    frames.current++;
    const now = performance.now();
    acc.current += now - last.current;
    last.current = now;
    if (acc.current >= 500) {
      onStats({
        fps: Math.round((frames.current * 1000) / acc.current),
        calls: gl.info.render.calls,
        tris: gl.info.render.triangles,
      });
      frames.current = 0;
      acc.current = 0;
    }
  });
  return null;
}

export default function MetaverseGallery() {
  const { open: openModal, token: activeModalToken } = useTokenViewer();

  const [tokens, setTokens] = useState<ObjktToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [score, setScore] = useState(0);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [boughtIds, setBoughtIds] = useState<Set<string>>(new Set());
  const playerPos = useRef(PLAYER_START.clone());
  const [isLocked, setIsLocked] = useState(false);
  const [nearestFrame, setNearestFrame] = useState<number | null>(null);
  const [bonusText, setBonusText] = useState<string | null>(null);
  const playerControlsRef = useRef<PlayerControlsRef>(null);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  // Frames close enough to load the full artwork + animate (perf gate).
  const [activeFrames, setActiveFrames] = useState<Set<number>>(new Set());
  const [perf, setPerf] = useState({ fps: 0, calls: 0, tris: 0 });

  // Fetch SideQuest collection only, sort cheapest → priciest
  useEffect(() => {
    const aliases = ["sidequest"];
    Promise.all(
      aliases.map((a) =>
        fetch(`/api/objkt?alias=${a}&limit=300`)
          .then((r) => r.json())
          .then((d) => (d.tokens ?? []) as ObjktToken[])
          .catch(() => [] as ObjktToken[])
      )
    )
      .then((lists) => {
        // Merge + de-dupe by contract/token_id
        const seen = new Set<string>();
        const merged: ObjktToken[] = [];
        for (const t of lists.flat()) {
          const id = `${t.fa_contract}-${t.token_id}`;
          if (seen.has(id)) continue;
          seen.add(id);
          // Only flat artworks in the frames: image / gif / video. No 3D (glb) or interactive html.
          const k = detectKind(t.mime);
          if (k === "model" || k === "html") continue;
          if (isDisplayableToken(t) && !t.name?.match(/^G0dz\s*#/i)) merged.push(t);
        }
        merged.sort((a, b) => {
          const pa = lowestPriceXtz(a) ?? 999999;
          const pb = lowestPriceXtz(b) ?? 999999;
          return pa - pb;
        });
        setTokens(merged);
      })
      .catch(console.error)
      .finally(() => setLoadingTokens(false));
  }, []);

  // Map tokens to frame spots (cycle if tokens < 34)
  // Limit to 10 on mobile, 20 on desktop to prevent overload
  const isMobileDevice = typeof window !== 'undefined' && (window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const initialFrameCount = isMobileDevice ? 18 : FRAME_SPOTS.length;

  // Expand frame spots into render UNITS. Tall thin slots (slots:3) split into 3 stacked
  // artworks; the curved spot becomes a single unit painted onto the GLB mesh. Tokens are
  // assigned sequentially across all units.
  const units = useMemo(() => {
    type Unit = {
      key: string; pos: [number, number, number]; rotY: number; w: number; h: number;
      token: ObjktToken; meshDigits?: string;
    };
    if (tokens.length === 0) return [] as Unit[];
    const out: Unit[] = [];
    let t = 0;
    const spots = FRAME_SPOTS.slice(0, initialFrameCount);
    spots.forEach((spot, s) => {
      const n = spot.slots && spot.slots > 1 ? spot.slots : 1;
      if (n === 1) {
        // Single frame → painted directly onto its GLB mesh (Object_574.00X, where the
        // frame index s+1 is the suffix; "574" + zero-padded number → digit match key).
        const digits = "574" + String(s + 1).padStart(3, "0");
        out.push({ key: `f${s}`, pos: spot.pos, rotY: spot.rotY, w: spot.w, h: spot.h, token: tokens[t % tokens.length], meshDigits: digits });
        t++;
      } else {
        // Tall thin slot → 3 stacked artworks as floating planes (one mesh can't show 3).
        const step = spot.h / n;
        const subH = step * 0.92;
        for (let k = 0; k < n; k++) {
          const y = spot.pos[1] + ((n - 1) / 2 - k) * step; // top → bottom
          out.push({ key: `f${s}_${k}`, pos: [spot.pos[0], y, spot.pos[2]], rotY: spot.rotY, w: spot.w, h: subH, token: tokens[t % tokens.length] });
          t++;
        }
      }
    });
    return out;
  }, [tokens, initialFrameCount]);

  // On-chain buy event → bonus score
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.tokenId) return;
      const id = String(detail.tokenId);
      if (boughtIds.has(id)) return;
      setBoughtIds((prev) => new Set([...prev, id]));
      const bonus = Math.max(2000, Math.ceil((detail.price ?? 5) * 1000));
      setScore((s) => s + bonus);
      playUnlockSound();
      showBonus(`ON-CHAIN COLLECT CONFIRMED! +${bonus} PTS`);
    };
    window.addEventListener("nft-bought", handler);
    return () => window.removeEventListener("nft-bought", handler);
  }, [boughtIds]);

  const showBonus = (text: string) => {
    setBonusText(text);
    setTimeout(() => setBonusText(null), 4000);
  };

  // Poll nearest frame spot + active set (rAF, no setState flood).
  // Active = the few NEAREST frames (capped) so a compact gallery doesn't end up
  // animating 27 GIFs at once. Radius alone was useless here.
  useEffect(() => {
    const MAX_ACTIVE = 9;
    const MAX_ACTIVE_R2 = 13 * 13;
    let rafId: number;
    const loop = () => {
      const pp = playerPos.current;
      const dists: { i: number; d2: number }[] = [];
      let closest: number | null = null;
      let minDist = 5.0; // interaction radius
      units.forEach((u, i) => {
        const dx = pp.x - u.pos[0];
        const dz = pp.z - u.pos[2];
        const d2 = dx * dx + dz * dz;
        dists.push({ i, d2 });
        const dist = Math.sqrt(d2);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      dists.sort((a, b) => a.d2 - b.d2);
      const next = new Set<number>();
      for (let j = 0; j < dists.length && j < MAX_ACTIVE; j++) {
        if (dists[j].d2 < MAX_ACTIVE_R2) next.add(dists[j].i);
      }
      setNearestFrame((prev) => (prev !== closest ? closest : prev));
      setActiveFrames((prev) => {
        if (prev.size === next.size) {
          let same = true;
          for (const i of next) if (!prev.has(i)) { same = false; break; }
          if (same) return prev;
        }
        return next;
      });
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [units]);

  // [E] key handler
  const handleInteract = useCallback(() => {
    if (nearestFrame === null || !units[nearestFrame]) return;
    const { token } = units[nearestFrame];
    const id = `${token.fa_contract}-${token.token_id}`;

    if (!discoveredIds.has(id)) {
      setDiscoveredIds((prev) => new Set([...prev, id]));
      const price = lowestPriceXtz(token) ?? 0;
      const pts = Math.max(100, Math.ceil(price * 100));
      setScore((s) => s + pts);
      playCollectSound();
      showBonus(`ARTWORK DISCOVERED · +${pts} PTS`);
    } else {
      playClickSound();
    }
    openModal(token);
  }, [nearestFrame, units, discoveredIds, openModal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && isLocked && !activeModalToken && nearestFrame !== null) {
        handleInteract();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLocked, activeModalToken, nearestFrame, handleInteract]);

  const handleExit = () => {
    playClickSound();
    window.location.href = "/";
  };

  const nearToken = nearestFrame !== null ? units[nearestFrame]?.token : null;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono select-none">
      {/* ──── THREE.JS CANVAS ──── */}
      <Canvas
        shadows={false}
        // Cap pixel ratio — on a retina/4K display an uncapped dpr renders 4× the
        // pixels and is the single biggest FPS killer here.
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 70,
          near: 0.1,
          far: 800,
          position: [PLAYER_START.x, PLAYER_START.y + 1.7, PLAYER_START.z],
        }}
      >
        <color attach="background" args={["#15120f"]} />
        <fog attach="fog" args={["#15120f", 60, 240]} />

        {/* Warm gallery fill. Kept a few point lights so the GLB (and its metalness
            materials) read properly; the real perf wins were the dpr cap + dropping
            the Bloom pass, not the lights. */}
        <ambientLight intensity={0.85} color="#f2e8d8" />
        <hemisphereLight args={["#fff3e0", "#1a1612", 0.6]} />
        <directionalLight position={[-12, 20, 8]} intensity={0.7} color="#fff4e6" />
        <pointLight position={[-22, 4.5, -4]} intensity={1.4} color="#ffe9cf" distance={26} decay={2} />
        <pointLight position={[-12, 4.5, -2]} intensity={1.4} color="#fff2e2" distance={26} decay={2} />
        <pointLight position={[-2, 4.5, -6]} intensity={1.2} color="#ffe9cf" distance={24} decay={2} />

        <PerfProbe onStats={setPerf} />

        <Suspense fallback={<LoadingOverlay />}>
          <Environment preset="apartment" />
          <GalleryScene />

          {/* NFT render units: single frames painted on their GLB mesh, tall slots as
              stacked floating planes. */}
          {units.map((u, i) => {
            const id = `${u.token.fa_contract}-${u.token.token_id}`;
            if (u.meshDigits) {
              return <MeshScreen key={u.key} token={u.token} digits={u.meshDigits} isActive={activeFrames.has(i)} />;
            }
            return (
              <NftFrame
                key={u.key}
                token={u.token}
                position={u.pos}
                rotY={u.rotY}
                maxW={u.w}
                maxH={u.h}
                isNear={nearestFrame === i}
                isActive={activeFrames.has(i)}
                isDiscovered={discoveredIds.has(id)}
                isBought={boughtIds.has(String(u.token.token_id))}
                onClick={() => {
                  playerControlsRef.current?.unlock();
                  openModal(u.token);
                }}
                isVideoPlaying={playingVideoIndex === i}
                onVideoPlay={() => setPlayingVideoIndex(playingVideoIndex === i ? null : i)}
              />
            );
          })}
        </Suspense>

        <PlayerControls
          ref={playerControlsRef}
          startPosition={PLAYER_START}
          positionRef={playerPos}
          onLockChange={setIsLocked}
          paused={!!activeModalToken}
        />

      </Canvas>

      {/* ──── PERF DIAGNOSTIC OVERLAY (temporary) ──── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-black/85 border border-cyan-500/50 px-4 py-2 font-mono text-[12px] tracking-wider flex gap-4">
        <span className={perf.fps < 30 ? "text-red-400" : perf.fps < 50 ? "text-yellow-400" : "text-green-400"}>
          {perf.fps} FPS
        </span>
        <span className="text-cyan-300">{perf.calls} draws</span>
        <span className="text-cyan-300">{(perf.tris / 1000).toFixed(0)}k tris</span>
        <span className="text-gray-500">active {activeFrames.size}</span>
      </div>

      {/* Cheap CSS vignette (replaces the GPU postprocessing pass) */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.65)" }}
      />

      {/* ──── CLICK TO ENTER OVERLAY ──── */}
      {!isLocked && !activeModalToken && (
        <div
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-8 cursor-pointer"
          onClick={() => {
            playerControlsRef.current?.lock();
          }}
        >
          <div className="text-center space-y-3">
            <div className="text-[10px] tracking-[0.8em] text-red-500 font-black uppercase">
              // NIKO_ALERCE :: 3D_GALLERY_SYSTEM
            </div>
            <h2 className="font-display font-black text-white text-3xl md:text-5xl uppercase tracking-tight">
              CLICK ANYWHERE
              <br />
              <span className="text-cyan-400">TO ENTER</span>
            </h2>
          </div>

          <div className="border border-white/10 bg-black/60 p-6 text-[11px] tracking-[0.3em] leading-[2.2] text-gray-400 text-center space-y-0.5">
            <p><span className="text-white font-bold">WASD / ARROWS</span> — WALK</p>
            <p><span className="text-white font-bold">SHIFT</span> — SPRINT</p>
            <p><span className="text-white font-bold">SPACE</span> — JUMP</p>
            <p><span className="text-white font-bold">MOUSE</span> — LOOK</p>
            <p><span className="text-cyan-400 font-bold">[E]</span> — ANALYZE ARTWORK NEAR YOU</p>
            <p><span className="text-gray-600">ESC</span> — RELEASE CURSOR</p>
          </div>

          <div className="text-[9px] tracking-[0.4em]">
            {loadingTokens ? (
              <span className="text-cyan-400 animate-pulse">SYNCING TEZOS ARTWORKS...</span>
            ) : (
              <span className="text-green-400">
                {tokens.length} ARTWORKS · {FRAME_SPOTS.length} FRAMES ACTIVE
              </span>
            )}
          </div>
        </div>
      )}

      {/* ──── HUD (only when locked) ──── */}
      {isLocked && !activeModalToken && (
        <>
          {/* Score */}
          <div className="absolute top-4 left-4 z-30 bg-black/70 backdrop-blur border border-white/10 p-4 space-y-1.5">
            <div className="text-[8px] tracking-[0.5em] text-red-500">// ARCHIVAL_SCORE</div>
            <div className="text-2xl font-black text-white tracking-widest">
              {String(score).padStart(7, "0")}
              <span className="text-[10px] text-cyan-400 ml-1">PTS</span>
            </div>
            <div className="flex gap-4 text-[9px] tracking-[0.2em] text-gray-500">
              <span>VIEWED <span className="text-cyan-400 font-bold">{discoveredIds.size}</span></span>
              <span>OWNED <span className="text-green-400 font-bold">{boughtIds.size}</span></span>
              <span>TOTAL <span className="text-gray-600">{FRAME_SPOTS.length}</span></span>
            </div>
          </div>

          {/* Exit */}
          <button
            onClick={handleExit}
            className="absolute top-4 right-4 z-30 px-4 py-2 bg-black/70 backdrop-blur border border-white/15 text-white hover:border-red-500 hover:text-red-400 transition-all text-[10px] tracking-[0.4em]"
          >
            ✕ EXIT
          </button>

          {/* Crosshair */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="w-5 h-5 relative opacity-60">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 border border-white/60 rounded-full" />
            </div>
          </div>

          {/* Interaction prompt */}
          {nearToken && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="bg-black/80 backdrop-blur border border-cyan-500/60 px-6 py-4 text-center space-y-2 shadow-[0_0_20px_rgba(0,255,240,0.2)]">
                <div className="text-[8px] tracking-[0.5em] text-cyan-400">// ARTWORK_DETECTED</div>
                <div className="text-[13px] font-bold text-white truncate max-w-[280px]">
                  {nearToken.name ?? "untitled"}
                </div>
                <div className="text-[10px] tracking-[0.2em] text-gray-400">
                  {lowestPriceXtz(nearToken) !== null
                    ? `${lowestPriceXtz(nearToken)} XTZ · `
                    : "ARCHIVE · "}
                  <span className="text-cyan-400">PRESS [E] TO OPEN</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-[8px] tracking-[0.3em] text-white/20 whitespace-nowrap">
            WASD MOVE · SHIFT SPRINT · SPACE JUMP · [E] INTERACT · ESC RELEASE
          </div>
        </>
      )}

      {/* ──── BONUS POPUP ──── */}
      {bonusText && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-red-600 text-white px-6 py-2 font-black text-xs tracking-[0.3em] uppercase shadow-[0_0_25px_rgba(255,0,64,0.5)] animate-bounce">
            {bonusText}
          </div>
        </div>
      )}
    </div>
  );
}
