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
export function proxied(uri?: string | null, opts?: { redirect?: boolean }): string | null {
  if (!uri) return null;
  const base = `/api/ipfs?uri=${encodeURIComponent(uri)}`;
  // `redirect` videos straight to a CORS-enabled gateway (the proxy 307s instead of
  // streaming the bytes). On Vercel, piping a 40MB mp4 through a serverless function for
  // every Range request — re-racing gateways each time because the in-memory pin doesn't
  // survive across invocations — is what makes video crawl. A redirect lets the <video>
  // stream directly from the gateway with native Range, no lambda in the byte path.
  return opts?.redirect ? `${base}&redirect=1` : base;
}

/**
 * Loads an NFT's media as a THREE texture:
 *  - a cheap static first-frame texture for every frame (no ongoing cost),
 *  - the real animated GIF (decoded frame-by-frame via WebCodecs ImageDecoder) when
 *    `active`, played on a canvas with manual timing,
 *  - the real mp4 (VideoTexture) when `videoActive`.
 * Returns the current best texture + its aspect ratio.
 */
export function useNftMedia(
  token: ObjktToken,
  opts: { active: boolean; videoActive: boolean; bufferActive?: boolean },
) {
  const { active, videoActive, bufferActive = false } = opts;

  const [staticTex, setStaticTex] = useState<THREE.Texture | null>(null);
  const [animTex, setAnimTex] = useState<THREE.CanvasTexture | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const videoTexRef = useRef<THREE.VideoTexture | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const framesRef = useRef<{ bitmap: ImageBitmap; duration: number }[] | null>(null);
  const totalDurRef = useRef(1);
  const startTimeRef = useRef(0);
  const lastFrameIdxRef = useRef(-1);

  const kind = detectKind(token.mime);
  const isVideo = kind === "video";
  const isAnimated = token.mime === "image/gif";

  // For videos prefer the larger display_uri as the still — it's the crisp frame shown
  // when this screen is over the concurrent-video budget (full quality, just not moving).
  const thumbUri = isVideo
    ? (token.display_uri ?? token.thumbnail_uri ?? token.artifact_uri)
    : (token.thumbnail_uri ?? token.display_uri ?? token.artifact_uri);
  const fullUri = token.artifact_uri ?? token.display_uri ?? thumbUri;
  const thumbUrl = proxied(thumbUri);
  const videoUrl = isVideo ? proxied(fullUri, { redirect: true }) : null;

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

  // ── Create + buffer the mp4 as soon as the frame is nearby (active OR playing) ──
  // Keyed on `shouldLoadVideo` (not videoActive) so walking from "nearby" into
  // "playing" range does NOT tear down and re-download the element — the buffer it
  // built up while you approached is exactly what makes playback start instantly.
  // Create + buffer the <video> when the frame is either playing OR merely close enough to
  // pre-buffer (bufferActive). Pre-buffered videos download (preload=auto) but don't play
  // or upload a texture, so the bytes are already there the instant you look at one — which
  // is what kills the "load, then wait to play" delay on the cold production gateways.
  const shouldLoadVideo = isVideo && !!videoUrl && (videoActive || bufferActive);
  useEffect(() => {
    if (!shouldLoadVideo || !videoUrl) return;
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto"; // begin buffering immediately, even before we play
    video.src = videoUrl;
    const videoTex = new THREE.VideoTexture(video);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    videoElRef.current = video;
    videoTexRef.current = videoTex;
    setVideoReady(false);

    const onMeta = () => {
      if (video.videoWidth && video.videoHeight) setAspect(video.videoWidth / video.videoHeight);
    };
    const onReady = () => setVideoReady(true);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("loadeddata", onReady);

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("loadeddata", onReady);
      video.pause();
      video.src = "";
      video.load();
      videoTex.dispose();
      videoElRef.current = null;
      videoTexRef.current = null;
      setVideoReady(false);
      setVideoTexture(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoadVideo, videoUrl]);

  // ── Play + show the buffered video only when actually in playing range ──
  // Keep showing the static thumbnail until the video has a decoded frame; swapping to
  // the VideoTexture before then would paint the frame black while it loads.
  useEffect(() => {
    const video = videoElRef.current;
    const videoTex = videoTexRef.current;
    if (!video || !videoTex) return;
    if (videoActive) {
      video.play().catch(() => {});
      if (videoReady) setVideoTexture(videoTex);
    } else {
      video.pause();
      setVideoTexture(null);
    }
  }, [videoActive, videoReady]);

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

/**
 * Plays a curated list of video tokens back-to-back on a single screen (a playlist).
 * Each clip plays in full (with sound when `withSound`), then advances to the next and
 * loops. Shows the current track's static thumbnail until its video has a decoded frame,
 * and whenever the screen isn't `active` (so it isn't blasting audio from across the room).
 */
export function usePlaylistMedia(
  tokens: ObjktToken[],
  opts: { active: boolean; withSound: boolean; onTrack?: (token: ObjktToken) => void },
) {
  const { active, withSound, onTrack } = opts;
  const [idx, setIdx] = useState(0);
  const [staticTex, setStaticTex] = useState<THREE.Texture | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);

  const count = tokens.length;
  const token = count ? tokens[idx % count] : null;
  const thumbUri = token?.thumbnail_uri ?? token?.display_uri ?? token?.artifact_uri;
  const fullUri = token?.artifact_uri ?? token?.display_uri ?? thumbUri;
  const thumbUrl = proxied(thumbUri);
  const videoUrl = proxied(fullUri, { redirect: true });

  // Report the current track up (for the HUD) whenever it changes.
  useEffect(() => {
    if (token) onTrack?.(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Static thumbnail of the current track (shown until its video is ready / when idle).
  useEffect(() => {
    if (!thumbUrl) return;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let cancelled = false;
    loader.load(thumbUrl, (tex) => {
      if (cancelled) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      const img = tex.image as HTMLImageElement;
      if (img?.width && img?.height) setAspect(img.width / img.height);
      setStaticTex((prev) => { prev?.dispose(); return tex; });
    });
    return () => { cancelled = true; };
  }, [thumbUrl]);

  // Play the current track while the screen is active; advance to the next on 'ended'.
  useEffect(() => {
    if (!active || !videoUrl) return;
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = !withSound;
    video.volume = 1;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;

    const onMeta = () => {
      if (video.videoWidth && video.videoHeight) setAspect(video.videoWidth / video.videoHeight);
    };
    const onReady = () => setVideoTexture(tex);
    const onEnded = () => setIdx((i) => (i + 1) % Math.max(1, count));
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("ended", onEnded);
    video.play().catch(() => {
      // Autoplay-with-sound can be blocked until a user gesture; retry muted so the
      // playlist still advances visually rather than stalling.
      video.muted = true;
      video.play().catch(() => {});
    });

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("ended", onEnded);
      video.pause();
      video.src = "";
      video.load();
      tex.dispose();
      setVideoTexture(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, videoUrl, withSound, count]);

  const map = (active ? videoTexture : null) ?? staticTex;
  return { map, aspect, isVideo: true };
}
