"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ObjktToken } from "@/lib/types";
import { detectKind } from "@/lib/objkt";

// Cap the working canvas so animated GIFs don't melt the GPU.
const MAX_CANVAS_PX = 512;

// Route IPFS media through our own /api/ipfs proxy so the browser loads it same-origin
// (WebGL textures need CORS; many public gateways don't send CORS headers / rate-limit).
export function proxied(uri?: string | null): string | null {
  if (!uri) return null;
  return `/api/ipfs?uri=${encodeURIComponent(uri)}`;
}

/**
 * Loads an NFT's media as a THREE texture:
 *  - a cheap static first-frame texture for every frame (no ongoing cost),
 *  - the real animated GIF (decoded frame-by-frame via WebCodecs ImageDecoder) when
 *    `active`, played on a canvas with manual timing,
 *  - the real mp4 (VideoTexture) when `videoActive`.
 * Returns the current best texture + its aspect ratio.
 */
export function useNftMedia(token: ObjktToken, opts: { active: boolean; videoActive: boolean }) {
  const { active, videoActive } = opts;

  const [staticTex, setStaticTex] = useState<THREE.Texture | null>(null);
  const [animTex, setAnimTex] = useState<THREE.CanvasTexture | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const framesRef = useRef<{ bitmap: ImageBitmap; duration: number }[] | null>(null);
  const totalDurRef = useRef(1);
  const startTimeRef = useRef(0);
  const lastFrameIdxRef = useRef(-1);

  const kind = detectKind(token.mime);
  const isVideo = kind === "video";
  const isAnimated = token.mime === "image/gif";

  const thumbUri = token.thumbnail_uri ?? token.display_uri ?? token.artifact_uri;
  const fullUri = token.artifact_uri ?? token.display_uri ?? thumbUri;
  const thumbUrl = proxied(thumbUri);
  const videoUrl = isVideo ? proxied(fullUri) : null;

  // ── Static first-frame texture (always) ──
  useEffect(() => {
    if (!thumbUrl) { setLoadError(true); setLoading(false); return; }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) { setLoadError(true); setLoading(false); }
    }, 20000);

    loader.load(
      thumbUrl,
      (tex) => {
        if (cancelled) { tex.dispose(); return; }
        clearTimeout(timeoutId);
        tex.colorSpace = THREE.SRGBColorSpace;
        const img = tex.image as HTMLImageElement;
        if (img?.width && img?.height) setAspect(img.width / img.height);
        setStaticTex((prev) => { prev?.dispose(); return tex; });
        setLoadError(false);
        setLoading(false);
      },
      undefined,
      () => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setLoadError(true);
        setLoading(false);
      }
    );
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [thumbUrl]);

  // ── Animated GIF (active only) — decode every frame with WebCodecs ImageDecoder ──
  useEffect(() => {
    const cleanupFrames = () => {
      framesRef.current?.forEach((f) => f.bitmap.close());
      framesRef.current = null;
      canvasElRef.current = null;
      canvasCtxRef.current = null;
      lastFrameIdxRef.current = -1;
    };

    // A GIF is never a video, so videoActive doesn't apply here.
    if (!active || !isAnimated) {
      cleanupFrames();
      setAnimTex((prev) => { prev?.dispose(); return null; });
      return;
    }
    const url = proxied(fullUri);
    const ImageDecoderCtor = (globalThis as unknown as { ImageDecoder?: unknown }).ImageDecoder;
    if (!url || typeof ImageDecoderCtor !== "function") return; // fallback: static texture stays

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok || cancelled) return;
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const type = res.headers.get("content-type") ?? "image/gif";

        const decoder: any = new (ImageDecoderCtor as any)({ data: buf, type });
        await decoder.tracks.ready;
        const count: number = decoder.tracks.selectedTrack?.frameCount ?? 1;
        if (count <= 1 || cancelled) { decoder.close?.(); return; }

        const frames: { bitmap: ImageBitmap; duration: number }[] = [];
        let total = 0;
        for (let i = 0; i < count; i++) {
          if (cancelled) break;
          const { image } = await decoder.decode({ frameIndex: i });
          const bitmap = await createImageBitmap(image);
          const durMs = (image.duration ?? 100000) / 1000;
          image.close?.();
          frames.push({ bitmap, duration: durMs > 0 ? durMs : 80 });
          total += durMs > 0 ? durMs : 80;
        }
        decoder.close?.();
        if (cancelled || frames.length === 0) { frames.forEach((f) => f.bitmap.close()); return; }

        const w = frames[0].bitmap.width;
        const h = frames[0].bitmap.height;
        const scale = Math.min(1, MAX_CANVAS_PX / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(frames[0].bitmap, 0, 0, canvas.width, canvas.height);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;

        framesRef.current = frames;
        totalDurRef.current = total || 1;
        canvasElRef.current = canvas;
        canvasCtxRef.current = ctx;
        startTimeRef.current = performance.now();
        lastFrameIdxRef.current = 0;
        setAspect(w / h);
        setAnimTex((prev) => { prev?.dispose(); return tex; });
      } catch {
        /* decoding failed → keep static */
      }
    })();

    return () => {
      cancelled = true;
      cleanupFrames();
      setAnimTex((prev) => { prev?.dispose(); return null; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isAnimated, fullUri]);

  // ── Real mp4 playback when videoActive ──
  useEffect(() => {
    if (!isVideo || !videoActive || !videoUrl) return;
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    const videoTex = new THREE.VideoTexture(video);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    const onMeta = () => {
      if (video.videoWidth && video.videoHeight) setAspect(video.videoWidth / video.videoHeight);
    };
    video.addEventListener("loadedmetadata", onMeta);
    setVideoTexture(videoTex);
    video.play().catch(() => {});
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.pause();
      video.src = "";
      videoTex.dispose();
      setVideoTexture(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, videoActive, videoUrl]);

  // Advance the decoded GIF every frame.
  useFrame(() => {
    const frames = framesRef.current;
    if (animTex && frames && canvasCtxRef.current && canvasElRef.current) {
      const elapsed = (performance.now() - startTimeRef.current) % totalDurRef.current;
      let acc = 0;
      let idx = frames.length - 1;
      for (let i = 0; i < frames.length; i++) {
        acc += frames[i].duration;
        if (elapsed < acc) { idx = i; break; }
      }
      if (idx !== lastFrameIdxRef.current) {
        lastFrameIdxRef.current = idx;
        const c = canvasElRef.current;
        canvasCtxRef.current.drawImage(frames[idx].bitmap, 0, 0, c.width, c.height);
        animTex.needsUpdate = true;
      }
    }
  });

  const map = videoTexture ?? animTex ?? staticTex;
  return { map, aspect, loading, error: loadError, isVideo };
}
