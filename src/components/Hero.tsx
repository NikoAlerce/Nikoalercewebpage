"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import GlitchText from "./GlitchText";

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center text-ash text-xs">
      <span className="animate-pulse">// LOADING SHADERS...</span>
    </div>
  ),
});

type ObjktToken = {
  artifact_uri?: string | null;
  mime?: string | null;
  name?: string | null;
};

export default function Hero() {
  const [glbUrls, setGlbUrls] = useState<string[]>([]);

  // Fetch GLB models from OBJKT API
  useEffect(() => {
    async function loadGlbs() {
      try {
        const res = await fetch("/api/objkt?alias=nikoalerce&limit=300");
        if (!res.ok) return;
        const data = await res.json();
        const tokens: ObjktToken[] = data.tokens ?? [];
        
        // Filter only GLB/GLTF models
        const models = tokens
          .filter(
            (t) =>
              t.mime === "model/gltf-binary" ||
              t.mime === "model/gltf+json",
          )
          .map((t) => t.artifact_uri!)
          .filter(Boolean);

        // Take up to 6 random GLBs for the hero
        const shuffled = models.sort(() => Math.random() - 0.5);
        setGlbUrls(shuffled.slice(0, 6));
      } catch {
        // Silently fail — hero works fine without GLBs
      }
    }
    loadGlbs();
  }, []);

  return (
    <section
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden bg-void"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,64,0.05),transparent_70%)]" />

      {/* Full-bleed 3D scene with shader orb + GLBs + interactive text carousel */}
      <div className="absolute inset-0">
        <Scene3D className="absolute inset-0" glbUrls={glbUrls} />
      </div>

      {/* Minimal overlay — artist identity */}
      <div className="relative z-10 pointer-events-none max-w-[1800px] mx-auto px-6 md:px-12 pt-32 md:pt-40">
        {/* Top-left meta coordinates */}
        <div className="flex flex-col gap-1 text-[9px] tracking-[0.5em] text-ash/40 uppercase mb-8">
          <div className="flex items-center gap-4">
            <span className="text-glitch-red">//</span>
            <span>SYSTEM_ORIGIN::PATAGONIA_VOID</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-1 h-1 bg-glitch-lime rounded-full animate-pulse" />
            <span className="text-glitch-lime/60">
              NODE_STATUS::SYNCHRONIZED
              {glbUrls.length > 0 && ` · ${glbUrls.length}_MODELS_LOADED`}
            </span>
          </div>
        </div>

        {/* Artist name */}
        <h1 className="font-display font-black leading-[0.8] tracking-tighter text-bone uppercase">
          <span className="block text-[clamp(3rem,12vw,11rem)] opacity-90">
            <GlitchText>NIKO</GlitchText>
          </span>
          <span className="block text-[clamp(3rem,12vw,11rem)] text-glitch-red -mt-[2vw] opacity-90">
            <GlitchText>ALERCE</GlitchText>
          </span>
        </h1>

        <p className="mt-6 text-sm md:text-base text-ash/70 max-w-lg leading-relaxed">
          Sculpting inside the void. 3D pieces, animations, and glitch
          experiments. Move your cursor to interact. Click the floating text to navigate.
        </p>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40 pointer-events-none">
        <span className="text-[9px] tracking-[0.5em] text-ash uppercase">SCROLL_TO_EXPLORE</span>
        <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center p-1">
          <div className="w-1 h-1 bg-bone rounded-full animate-bounce" />
        </div>
      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden border-y border-white/10 py-2 bg-void/40 backdrop-blur-sm">
        <div className="flex animate-marquee whitespace-nowrap text-xs tracking-[0.4em] text-ash">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0">
              {[
                "GLITCH/CORE",
                "TEZOS_NATIVE",
                "3D_VISUAL_ARTIST",
                "OBJKT://NIKOALERCE",
                "ALTER_EGO::SIDEQUEST",
                "WEBGL//R3F",
                "AR/VR_READY",
                "VOID_SIGNAL",
              ].map((w) => (
                <span key={w} className="px-8 flex items-center gap-3">
                  <span className="text-glitch-red">▌</span>
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
