"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

export default function ArtworkThumbnail({ sources, alt, priority = false }: {
  sources: string[]; alt: string; priority?: boolean;
}) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priority);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = sources[attempt];
  useEffect(() => {
    if (visible) return;
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "250px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible || loaded || !src) return;
    const timer = window.setTimeout(() => setAttempt((value) => value + 1), 18000);
    return () => clearTimeout(timer);
  }, [visible, loaded, src]);
  return <div ref={ref} className="absolute inset-0">
    {!loaded && <div className="absolute inset-0 grid place-items-center text-[10px] text-ash" role={!src ? "status" : undefined}>
      {src ? (lang === "es" ? "Cargando imagen…" : "Loading image…") : (lang === "es" ? "Vista previa no disponible" : "Preview unavailable")}
    </div>}
    {visible && src && <img key={src} src={src} alt={alt} decoding="async" fetchPriority={priority ? "high" : "auto"}
      onLoad={() => setLoaded(true)} onError={() => setAttempt((value) => value + 1)}
      className={`w-full h-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} />}
  </div>;
}
