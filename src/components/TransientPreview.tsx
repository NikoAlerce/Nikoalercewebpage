"use client";

import { useEffect, useRef, useState } from "react";
import manifest from "@/lib/transientPreviewManifest.json";
import { useLang } from "@/lib/i18n";

type Preview = { video: string; poster: string; width: number; height: number };
const previews: Record<string, Preview> = manifest;

/** Preserve full framing and animation, loading video only near the viewport. */
export default function TransientPreview({ image, alt }: { image: string | null; alt: string }) {
  const { lang } = useLang();
  const preview = image ? previews[image] : undefined;
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visited, setVisited] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const params = new URLSearchParams({ url: image ?? "", w: "384", output: "webp", n: "-1", we: "" });
  params.sort();
  useEffect(() => {
    if (!window.IntersectionObserver) { setNear(true); setVisited(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      setNear(entry.isIntersecting);
      if (entry.isIntersecting) setVisited(true);
    }, { rootMargin: "150px" });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (near && visited) element.play().catch(() => {});
    else element.pause();
  }, [near, visited, videoFailed, preview?.video]);

  return <div ref={container} className="relative bg-black"
    style={preview ? { aspectRatio: `${preview.width} / ${preview.height}` } : { minHeight: imageLoaded ? undefined : "12rem" }}>
    {preview && !videoFailed ? <video ref={video} src={visited ? preview.video : undefined}
      poster={preview.poster} width={preview.width} height={preview.height}
      loop muted playsInline preload="none" aria-label={alt}
      onError={() => setVideoFailed(true)} className="block w-full h-auto" /> :
      image && !imageFailed ? <>
        {!imageLoaded && <div className="absolute inset-0 grid place-items-center text-[10px] text-ash">{lang === "es" ? "Cargando animación…" : "Loading animation…"}</div>}
        {visited && <img src={`https://img.transient.xyz/?${params}`} alt={alt} decoding="async"
          onLoad={() => setImageLoaded(true)} onError={() => setImageFailed(true)}
          className={`block w-full h-auto ${imageLoaded ? "opacity-100" : "opacity-0"}`} />}
      </> : <div role="status" className="min-h-48 grid place-items-center text-[10px] text-ash">{lang === "es" ? "Vista previa no disponible" : "Preview unavailable"}</div>}
  </div>;
}
