"use client";

import { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { ObjktToken } from "@/lib/types";
import { ipfsToUrl, ipfsWithGateway, IPFS_GATEWAYS, detectKind, lowestPriceXtz } from "@/lib/objkt";

type Props = {
  token: ObjktToken;
  position: [number, number, number];
  rotY: number;
  index: number;
  isNear: boolean;
  isDiscovered: boolean;
  isBought: boolean;
  onClick?: () => void;
  playerPosition?: THREE.Vector3;
  isVideoPlaying?: boolean;
  onVideoPlay?: () => void;
};

const MAX_WIDTH = 2.0;
const MAX_HEIGHT = 2.5;

export default function NftFrame({
  token,
  position,
  rotY,
  index,
  isNear,
  isDiscovered,
  isBought,
  onClick,
  playerPosition,
  isVideoPlaying,
  onVideoPlay,
}: Props) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const geometryRef = useRef<THREE.PlaneGeometry>(null);

  // Detect NFT type
  const kind = detectKind(token.mime);

  // Use thumbnail_uri first for reliability - artifact_uri often fails
  const rawUri = token.thumbnail_uri ?? token.display_uri ?? token.artifact_uri;
  const imageUrl = rawUri ? ipfsWithGateway(rawUri, gatewayIdx) : null;

  // Check if thumbnail is a GIF (for animated thumbnails)
  const isGifThumbnail = rawUri?.toLowerCase().includes('.gif') || token.mime === 'image/gif';

  // Video URI for playback (for videos and GIF thumbnails)
  const videoUri = (kind === "video" || isGifThumbnail) ? ipfsToUrl(rawUri ?? token.artifact_uri) : null;

  // Calculate distance to player for lazy loading
  const distance = playerPosition
    ? new THREE.Vector3(...position).distanceTo(playerPosition)
    : Infinity;
  const shouldLoad = true; // Load all textures

  useEffect(() => {
    if (!rawUri) {
      setLoadError(true);
      setLoading(false);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    // Add timeout to prevent freezing
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.warn(`Timeout loading texture for ${token.name} after 15s, trying next gateway`);
        if (gatewayIdx < IPFS_GATEWAYS.length - 1) {
          setGatewayIdx((i) => i + 1);
        } else {
          console.error(`All gateways failed for ${token.name}`);
          setLoadError(true);
          setLoading(false);
        }
      }
    }, 15000); // 15 second timeout

    loader.load(
      imageUrl ?? "",
      (tex) => {
        if (cancelled) { tex.dispose(); return; }
        clearTimeout(timeoutId);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        console.log(`Texture loaded successfully for ${token.name}`, tex);
        // Calculate aspect ratio from image
        if (tex.image) {
          const img = tex.image as HTMLImageElement;
          if (img.width && img.height) {
            const imgAspect = img.width / img.height;
            console.log(`${token.name} aspect ratio: ${imgAspect} (${img.width}x${img.height})`);
            setAspectRatio(imgAspect);
          } else {
            console.warn(`Image dimensions not available for ${token.name}`, img);
          }
        } else {
          console.warn(`Texture image not available for ${token.name}`, tex);
        }
        setTexture(tex);
        setLoading(false);
      },
      (progress) => {
        console.log(`Loading ${token.name}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
      },
      (error) => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          console.error(`Failed to load texture for ${token.name}`, error, imageUrl);
          // Try next IPFS gateway on error
          if (gatewayIdx < IPFS_GATEWAYS.length - 1) {
            setGatewayIdx((i) => i + 1);
          } else {
            setLoadError(true);
            setLoading(false);
          }
        }
      }
    );
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [imageUrl, rawUri, gatewayIdx, token.name]);

  // Handle video playback (for videos and GIF thumbnails)
  useEffect(() => {
    // For GIFs, auto-play immediately without requiring click
    // For videos, only play when isVideoPlaying is true
    const shouldPlay = isGifThumbnail ? true : isVideoPlaying;

    if ((kind === "video" || isGifThumbnail) && shouldPlay && videoUri) {
      const video = document.createElement("video");
      video.src = videoUri;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.playsInline = true;

      const videoTex = new THREE.VideoTexture(video);
      videoTex.colorSpace = THREE.SRGBColorSpace;
      setVideoTexture(videoTex);

      video.play().catch(console.error);

      return () => {
        video.pause();
        video.src = "";
        videoTex.dispose();
      };
    } else if (!shouldPlay && videoTexture) {
      videoTexture.dispose();
      setVideoTexture(null);
    }
  }, [kind, isVideoPlaying, videoUri, isGifThumbnail]);

  // Colours by status
  const glowColor = isBought ? "#39ff14" : isNear ? "#00fff0" : isDiscovered ? "#4488ff" : "#ff0040";

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Subtle vertical float
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + index * 0.7) * 0.04;
    }

    // Glow pulsing
    if (glowRef.current) {
      const base = isBought ? 3 : isNear ? 2 : isDiscovered ? 1 : 0.3;
      const pulse = isBought ? Math.sin(t * 3) * 0.8 : isNear ? Math.sin(t * 2) * 0.4 : 0;
      glowRef.current.intensity = base + pulse;
    }
  });

  const price = lowestPriceXtz(token);

  // Calculate dimensions based on aspect ratio, fitting within max bounds
  const effectiveAspectRatio = aspectRatio ?? 1; // Default to 1:1 if not loaded yet
  let frameWidth = MAX_WIDTH;
  let frameHeight = MAX_HEIGHT;

  if (effectiveAspectRatio > 1) {
    // Landscape: fit width, scale height
    frameWidth = MAX_WIDTH;
    frameHeight = MAX_WIDTH / effectiveAspectRatio;
  } else {
    // Portrait: fit height, scale width
    frameHeight = MAX_HEIGHT;
    frameWidth = MAX_HEIGHT * effectiveAspectRatio;
  }

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Neutral white light to illuminate artwork without color tint */}
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

      <group ref={groupRef}>
        {/* Outer neon edge */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[frameWidth + 0.18, frameHeight + 0.18, 0.015]} />
          <meshBasicMaterial color={glowColor} toneMapped={false} />
        </mesh>

        {/* Frame body */}
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[frameWidth + 0.1, frameHeight + 0.1, 0.07]} />
          <meshStandardMaterial color="#0a0a10" roughness={0.85} metalness={0.5} />
        </mesh>

        {/* Canvas/artwork with proper aspect ratio */}
        <mesh
          position={[0, 0, 0.008]}
          onClick={kind === "video" ? onVideoPlay : onClick}
        >
          <planeGeometry args={[frameWidth, frameHeight]} />
          {videoTexture ? (
            <meshStandardMaterial map={videoTexture} color="#ffffff" side={THREE.FrontSide} toneMapped={false} />
          ) : texture ? (
            <meshStandardMaterial map={texture} color="#ffffff" side={THREE.FrontSide} toneMapped={false} />
          ) : (
            <meshStandardMaterial color="#0c0c14" side={THREE.FrontSide} />
          )}
        </mesh>

        {/* Loading / Error overlay */}
        {(loading || loadError) && (
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.07}
            color={loadError ? "#ff0040" : "#00fff0"}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
          >
            {loadError ? "// LOAD_ERROR" : "// DECRYPTING..."}
          </Text>
        )}

        {/* Label plate */}
        <group position={[0, -(frameHeight / 2) - 0.2, 0.01]}>
          {/* Background */}
          <mesh position={[0, 0, -0.002]}>
            <planeGeometry args={[1.8, 0.26]} />
            <meshBasicMaterial color="#060608" transparent opacity={0.9} />
          </mesh>
          {/* Border */}
          <mesh position={[0, 0, -0.004]}>
            <planeGeometry args={[1.84, 0.30]} />
            <meshBasicMaterial color={glowColor} toneMapped={false} />
          </mesh>

          <Text
            position={[0, 0.05, 0]}
            fontSize={0.062}
            color="#e0e0e0"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.7}
            letterSpacing={0.06}
          >
            {(token.name ?? "UNTITLED").toUpperCase().slice(0, 22)}
          </Text>

          <Text
            position={[0, -0.06, 0]}
            fontSize={0.05}
            color={price !== null ? "#39ff14" : "#666"}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.04}
          >
            {price !== null ? `${price} XTZ` : "ARCHIVE"}
          </Text>
        </group>

        {/* "NEAR" interaction indicator */}
        {isNear && (
          <Text
            position={[0, frameHeight / 2 + 0.25, 0.02]}
            fontSize={0.075}
            color="#00fff0"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.12}
          >
            [E] INTERACT
          </Text>
        )}
      </group>
    </group>
  );
}
