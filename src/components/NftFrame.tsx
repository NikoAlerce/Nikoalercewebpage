"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ObjktToken } from "@/lib/types";
import { useNftMedia } from "./useNftMedia";

type Props = {
  token: ObjktToken;
  position: [number, number, number];
  rotY: number;
  isNear: boolean;
  isActive: boolean;
  isDiscovered: boolean;
  isBought: boolean;
  onClick?: () => void;
  isVideoPlaying?: boolean;
  onVideoPlay?: () => void;
  // The size of the real painting slot on the wall.
  maxW?: number;
  maxH?: number;
};

export default function NftFrame({
  token,
  position,
  rotY,
  isNear,
  isActive,
  isDiscovered,
  isBought,
  onClick,
  isVideoPlaying,
  onVideoPlay,
  maxW = 2.0,
  maxH = 2.5,
}: Props) {
  const MAX_WIDTH = maxW;
  const MAX_HEIGHT = maxH;

  const glowRef = useRef<THREE.PointLight>(null);
  const videoActive = isNear || !!isVideoPlaying;
  const { map, aspect, isVideo } = useNftMedia(token, {
    active: isActive,
    videoActive,
  });

  const glowColor = isBought ? "#9fe6ab" : isNear ? "#ffe1b0" : isDiscovered ? "#c2cee2" : "#b3a382";

  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.getElapsedTime();
      const base = isBought ? 3 : isNear ? 2 : isDiscovered ? 1 : 0.3;
      const pulse = isBought ? Math.sin(t * 3) * 0.8 : isNear ? Math.sin(t * 2) * 0.4 : 0;
      glowRef.current.intensity = base + pulse;
    }
  });

  // ── Contain fit: keep the artwork's own aspect ratio, centred, black around it ──
  const a = aspect ?? 1;
  const slotAspect = MAX_WIDTH / MAX_HEIGHT;
  let artW = MAX_WIDTH;
  let artH = MAX_HEIGHT;
  if (a > slotAspect) { artW = MAX_WIDTH; artH = MAX_WIDTH / a; }
  else { artH = MAX_HEIGHT; artW = MAX_HEIGHT * a; }

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {isNear && (
        <pointLight
          ref={glowRef}
          color="#ffffff"
          intensity={0.5}
          distance={4}
          decay={2}
          position={[0, 0, 0.5]}
        />
      )}

      {/* Solid PURE-BLACK box (unlit) straddling the GLB quad — hides its baked
          placeholder painting from any side and sits proud of the wall so the NFT reads
          as a mounted screen rather than a recessed frame. */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[MAX_WIDTH + 0.06, MAX_HEIGHT + 0.06, 0.12]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      {/* Neon glow edge */}
      <mesh position={[0, 0, 0.075]}>
        <boxGeometry args={[MAX_WIDTH + 0.12, MAX_HEIGHT + 0.12, 0.02]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} />
      </mesh>

      {/* Artwork — flat plane sized to its own aspect, sitting proud of the box */}
      {map && (
        <mesh position={[0, 0, 0.09]} onClick={isVideo ? onVideoPlay : onClick}>
          <planeGeometry args={[artW, artH]} />
          <meshBasicMaterial map={map} toneMapped={false} side={THREE.FrontSide} />
        </mesh>
      )}
      {/* No in-world name/price/[E] labels — they covered the artwork (and the one below
          it in stacks). The bottom-screen HUD is enough. */}
    </group>
  );
}
