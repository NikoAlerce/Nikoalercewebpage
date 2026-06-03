"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, useProgress } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useTokenViewer } from "./TokenViewerContext";
import { playClickSound, playUnlockSound, playCollectSound } from "@/lib/sound";
import PlayerControls, { PlayerControlsRef } from "./PlayerControls";
import GalleryScene from "./GalleryScene";
import NftFrame from "./NftFrame";
import type { ObjktToken } from "@/lib/types";
import { lowestPriceXtz, isDisplayableToken, detectKind, ipfsToUrl } from "@/lib/objkt";

// ============================================================
// 34 exact frame positions extracted from artgalery.glb
// Light_Inner_Body nodes – world-space translation + rotY
// ============================================================
const FRAME_SPOTS: { pos: [number, number, number]; rotY: number }[] = [
  { pos: [-25.771, 0.9, 4.791], rotY: -0.0145 + Math.PI },
  { pos: [-28.343, 0.9, 4.791], rotY: -0.0145 + Math.PI },
  { pos: [-30.983, 0.9, 4.791], rotY: -0.0145 + Math.PI },
  { pos: [-31.814, 0.9, -4.177], rotY: 3.1271 + Math.PI },
  { pos: [-28.947, 0.9, -4.177], rotY: 3.1271 + Math.PI },
  { pos: [-26.141, 0.9, -4.177], rotY: 3.1271 + Math.PI },
  { pos: [-21.965, 0.9, -6.822], rotY: -2.3225 + Math.PI },
  { pos: [-21.242, 0.9, -8.070], rotY: -2.7948 + Math.PI },
  { pos: [-20.230, 0.9, -8.333], rotY: -3.0417 + Math.PI },
  { pos: [-19.339, 0.9, -8.293], rotY: 2.8474 + Math.PI },
  { pos: [-18.671, 0.9, -7.876], rotY: 2.5371 + Math.PI },
  { pos: [-18.235, 0.9, -6.756], rotY: 2.2691 + Math.PI },
  { pos: [-21.806, 0.9, 8.351], rotY: -0.7456 + Math.PI },
  { pos: [-21.226, 0.9, 8.913], rotY: -0.4838 + Math.PI },
  { pos: [-20.300, 0.9, 9.291], rotY: -0.1028 + Math.PI },
  { pos: [-19.285, 0.9, 9.238], rotY: 0.3330 + Math.PI },
  { pos: [-18.602, 0.9, 8.501], rotY: 0.8534 + Math.PI },
  { pos: [-15.119, 0.9, -4.747], rotY: 2.8619 + Math.PI },
  { pos: [-15.086, 0.9, 5.148], rotY: -0.3678 + Math.PI },
  { pos: [-11.080, 0.9, -0.667], rotY: 2.9494 + Math.PI },
  { pos: [-11.080, 0.9, 1.052], rotY: 0.1644 + Math.PI },
  { pos: [-5.430, 0.9, -6.544], rotY: -1.5656 + Math.PI },
  { pos: [-5.430, 0.9, -9.782], rotY: -1.5785 + Math.PI },
  { pos: [-5.429, 0.9, -13.0], rotY: -1.5792 + Math.PI },
  { pos: [4.247, 0.9, -13.0], rotY: 1.5785 + Math.PI },
  { pos: [4.247, 0.9, -9.782], rotY: 1.5785 + Math.PI },
  { pos: [4.247, 0.9, -6.312], rotY: 1.5785 + Math.PI },
  { pos: [6.842, 0.9, -1.725], rotY: 2.5540 + Math.PI },
  { pos: [8.407, 0.9, 0.031], rotY: 1.5774 + Math.PI },
  { pos: [6.890, 0.9, 1.847], rotY: 0.4227 + Math.PI },
  { pos: [-0.003, 0.9, 8.573], rotY: 0.0151 + Math.PI },
  { pos: [4.373, 0.9, 5.466], rotY: 0.9651 + Math.PI },
  { pos: [-4.359, 0.9, 5.512], rotY: -0.6390 + Math.PI },
  { pos: [4.437, 0.9, -11.901], rotY: 2.2623 + Math.PI },
  { pos: [-3.419, 0.9, -13.166], rotY: -2.1451 + Math.PI },
];

// Player starts near the entrance area (positive X end of scene)
const PLAYER_START = new THREE.Vector3(6, 0.0, 0);

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
          artgalery.glb · {FRAME_SPOTS.length} FRAMES
        </div>
      </div>
    </Html>
  );
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

  // Fetch & sort tokens cheapest → most expensive
  useEffect(() => {
    fetch("/api/objkt?alias=nikoalerce&limit=300")
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.tokens ?? []).filter(
          (t: ObjktToken) => isDisplayableToken(t) && !t.name?.match(/^G0dz\s*#/i)
        );
        filtered.sort((a: ObjktToken, b: ObjktToken) => {
          const pa = lowestPriceXtz(a) ?? 999999;
          const pb = lowestPriceXtz(b) ?? 999999;
          return pa - pb;
        });
        setTokens(filtered);
      })
      .catch(console.error)
      .finally(() => setLoadingTokens(false));
  }, []);

  // Map tokens to frame spots (cycle if tokens < 34)
  // Limit to 10 on mobile, 20 on desktop to prevent overload
  const isMobileDevice = typeof window !== 'undefined' && (window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const initialFrameCount = isMobileDevice ? 10 : 20;

  const frameTokens = useMemo(() => {
    if (tokens.length === 0) return [];
    return FRAME_SPOTS.slice(0, initialFrameCount).map((spot, i) => ({
      spot,
      token: tokens[i % tokens.length],
    }));
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

  // Poll nearest frame spot (rAF, no setState flood)
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      const pp = playerPos.current;
      let closest: number | null = null;
      let minDist = 5.0; // interaction radius
      frameTokens.forEach(({ spot }, i) => {
        const dx = pp.x - spot.pos[0];
        const dz = pp.z - spot.pos[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setNearestFrame((prev) => (prev !== closest ? closest : prev));
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [frameTokens]);

  // [E] key handler
  const handleInteract = useCallback(() => {
    if (nearestFrame === null || !frameTokens[nearestFrame]) return;
    const { token } = frameTokens[nearestFrame];
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
  }, [nearestFrame, frameTokens, discoveredIds, openModal]);

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

  const nearToken = nearestFrame !== null ? frameTokens[nearestFrame]?.token : null;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono select-none">
      {/* ──── THREE.JS CANVAS ──── */}
      <Canvas
        shadows={false}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 70,
          near: 0.1,
          far: 150,
          position: [PLAYER_START.x, PLAYER_START.y + 1.7, PLAYER_START.z],
        }}
      >
        <color attach="background" args={["#020205"]} />
        <fog attach="fog" args={["#020205", 10, 80]} />

        {/* Lighting */}
        <ambientLight intensity={0.5} color="#b0b8ff" />
        <directionalLight position={[-10, 12, 0]} intensity={1.2} color="#fff6e8" />
        <directionalLight position={[5, 8, -5]} intensity={0.5} color="#3366ff" />
        <pointLight position={[-16, 4, 0]} intensity={3} color="#ff0040" distance={22} decay={2} />
        <pointLight position={[-5, 4, -5]} intensity={2} color="#00fff0" distance={20} decay={2} />
        <pointLight position={[4, 4, 0]} intensity={1.5} color="#ffffff" distance={18} decay={2} />

        <Suspense fallback={<LoadingOverlay />}>
          <Environment preset="night" />
          <GalleryScene />

          {/* NFT frames on the 34 Light_Inner_Body spots */}
          {frameTokens.map(({ spot, token }, i) => {
            const id = `${token.fa_contract}-${token.token_id}`;
            return (
              <NftFrame
                key={`nft-${i}`}
                token={token}
                position={spot.pos}
                rotY={spot.rotY}
                index={i}
                isNear={nearestFrame === i}
                isDiscovered={discoveredIds.has(id)}
                isBought={boughtIds.has(String(token.token_id))}
                onClick={() => {
                  playerControlsRef.current?.unlock();
                  openModal(token);
                }}
                playerPosition={playerPos.current}
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

        <EffectComposer multisampling={0}>
          <Bloom intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.3} darkness={0.5} />
        </EffectComposer>
      </Canvas>

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
