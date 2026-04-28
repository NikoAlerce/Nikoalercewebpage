"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import GlitchText from "./GlitchText";

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center text-ash text-xs">
      <span className="animate-pulse">// LOADING SHADERS...</span>
    </div>
  ),
});

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden bg-void"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0">
        <Scene3D className="absolute inset-0" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-6 md:left-10 text-[10px] tracking-[0.4em] text-ash">
          <div>// SYS / VOID v0.1</div>
          <div>// LAT -38.0 / LON -71.5</div>
          <div className="text-glitch-lime">// ONLINE</div>
        </div>

        <div className="absolute top-24 right-6 md:right-10 text-right text-[10px] tracking-[0.4em] text-ash">
          <div>NIKO_ALERCE.SYS</div>
          <div>3D / GLITCH / TEZOS</div>
          <div className="text-glitch-red">▌█▌▌█ {new Date().getFullYear()}</div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-10 pt-40 md:pt-48 pb-24">
        <p className="text-xs md:text-sm tracking-[0.5em] text-ash mb-6">
          [ VISUAL ARTIST // 3D // GLITCH ]
        </p>

        <h1 className="font-display font-bold leading-[0.85] tracking-tight text-bone uppercase">
          <span className="block text-[clamp(3rem,12vw,12rem)]">
            <GlitchText>NIKO</GlitchText>
          </span>
          <span className="block text-[clamp(3rem,12vw,12rem)] text-glitch-red">
            <GlitchText>ALERCE</GlitchText>
          </span>
        </h1>

        <div className="mt-10 grid md:grid-cols-3 gap-6 max-w-3xl">
          <div className="md:col-span-2">
            <p className="text-sm md:text-base text-ash leading-relaxed">
              Sculpting inside the void. 3D pieces, animations, and glitch
              experiments. Everything minted lives on Tezos and opens from
              Objkt in real time.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[11px] tracking-[0.25em] text-ash">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>STATUS</span>
              <span className="text-glitch-lime">ACTIVE</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>CHAIN</span>
              <span>TEZOS</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>RENDER</span>
              <span>WEBGL_2</span>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            href="/works"
            className="group relative inline-flex items-center gap-3 px-6 py-3 bg-bone text-void text-xs tracking-[0.3em] uppercase font-bold hover:bg-glitch-red hover:text-bone transition-colors"
          >
            ENTER THE VOID
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
          <Link
            href="/sidequest"
            className="inline-flex items-center gap-3 px-6 py-3 border border-white/20 text-xs tracking-[0.3em] uppercase text-ash hover:border-glitch-cyan hover:text-glitch-cyan transition-colors"
          >
            SIDEQUEST_MODE
          </Link>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-10 overflow-hidden border-y border-white/10 py-2 bg-void/40 backdrop-blur-sm">
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
