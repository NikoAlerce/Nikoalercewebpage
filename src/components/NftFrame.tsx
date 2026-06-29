"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ObjktToken } from "@/lib/types";
import { useNftMedia, usePlaylistMedia } from "./useNftMedia";

type Props = {
  token: ObjktToken;
  position: [number, number, number];
  rotY: number;
  isActive: boolean;
  // Allowed to actually play its video (within the concurrent-video budget). When false a
  // video frame shows its full-res still instead.
  shouldPlayVideo: boolean;
  isTargeted: boolean;
  isDiscovered: boolean;
  isBought: boolean;
  // The size of the real painting slot on the wall.
  maxW?: number;
  maxH?: number;
  // When set, this screen plays the given tokens as a looping video playlist (with sound)
  // instead of showing `token`.
  playlist?: ObjktToken[];
  // Reports the playlist's currently-playing track up to the gallery (for the HUD).
  onPlaylistTrack?: (token: ObjktToken) => void;
  // Crosshair-targeting registry: this frame registers its group under `index` so the
  // gallery's raycaster can resolve a hit back to a unit.
  index: number;
  targetsRef: React.MutableRefObject<Map<number, THREE.Object3D>>;
};

export default function NftFrame({
  token,
  position,
  rotY,
  isActive,
  shouldPlayVideo,
  isTargeted,
  isDiscovered,
  isBought,
  maxW = 2.0,
  maxH = 2.5,
  playlist,
  onPlaylistTrack,
  index,
  targetsRef,
}: Props) {
  const MAX_WIDTH = maxW;
  const MAX_HEIGHT = maxH;

  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const hasPlaylist = !!playlist?.length;
  // Both hooks run unconditionally (rules of hooks); the single-token one is parked
  // (inactive) when a playlist is driving this screen so it doesn't load needlessly.
  // Video playback is gated by `shouldPlayVideo` (the budget); GIFs by `isActive`.
  const single = useNftMedia(token, {
    active: hasPlaylist ? false : isActive,
    videoActive: hasPlaylist ? false : shouldPlayVideo,
  });
  const pl = usePlaylistMedia(hasPlaylist ? playlist! : [], {
    active: shouldPlayVideo,
    withSound: true,
    onTrack: onPlaylistTrack,
  });
  const { map, aspect } = hasPlaylist ? { map: pl.map, aspect: pl.aspect } : single;

  // Register this frame's group for crosshair raycasting.
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.userData.unitIndex = index;
    const targets = targetsRef.current;
    targets.set(index, g);
    return () => { targets.delete(index); };
  }, [index, targetsRef]);

  const glowColor = isBought ? "#9fe6ab" : isTargeted ? "#ffe1b0" : isDiscovered ? "#c2cee2" : "#b3a382";

  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.getElapsedTime();
      const base = isBought ? 3 : isTargeted ? 2.4 : isDiscovered ? 1 : 0.3;
      const pulse = isBought ? Math.sin(t * 3) * 0.8 : isTargeted ? Math.sin(t * 2) * 0.5 : 0;
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
    <group ref={groupRef} position={position} rotation={[0, rotY, 0]}>
      {isTargeted && (
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
          as a mounted screen rather than a recessed frame. Also the raycast target. */}
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
        <mesh position={[0, 0, 0.09]}>
          <planeGeometry args={[artW, artH]} />
          <meshBasicMaterial map={map} toneMapped={false} side={THREE.FrontSide} />
        </mesh>
      )}
      {/* No in-world name/price/[E] labels — they covered the artwork (and the one below
          it in stacks). The bottom-screen HUD is enough. */}
    </group>
  );
}
