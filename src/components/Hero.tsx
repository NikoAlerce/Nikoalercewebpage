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
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,64,0.05),transparent_70%)]" />
      <div className="absolute inset-0">
        <Scene3D className="absolute inset-0" />
      </div>

      {/* TOP META - MORE AGGRESSIVE */}
      <div className="absolute inset-x-0 top-32 px-6 md:px-12 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-1 text-[9px] tracking-[0.5em] text-ash/40 uppercase">
          <div className="flex items-center gap-4">
            <span className="text-glitch-red">//</span>
            <span>SYSTEM_ORIGIN::PATAGONIA_VOID</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-glitch-cyan">//</span>
            <span>COORD_MAPPING::S_38.000_W_71.500</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-1 h-1 bg-glitch-lime rounded-full animate-pulse" />
            <span className="text-glitch-lime/60">NODE_STATUS::SYNCHRONIZED</span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-1 text-[9px] tracking-[0.5em] text-ash/40 uppercase">
          <div className="font-mono text-bone/60">[{new Date().getFullYear()} // v2.0.4]</div>
          <div className="flex items-center gap-4">
            <span>PROTOCOL::TEZOS_L1</span>
            <span className="text-glitch-red">▌</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12 pt-56 md:pt-64 pb-32">
        <div className="inline-block relative mb-8">
          <span className="absolute -left-4 top-0 w-1 h-full bg-glitch-red/40" />
          <p className="text-[10px] md:text-xs tracking-[0.6em] text-ash uppercase pl-4">
            Visual Artist <span className="text-glitch-red mx-2">/</span> 3D Sculpting <span className="text-glitch-cyan mx-2">/</span> Glitch Theory
          </p>
        </div>

        <h1 className="font-display font-black leading-[0.8] tracking-tighter text-bone uppercase relative group">
          {/* Background large text outline */}
          <div className="absolute -top-12 -left-4 text-[15vw] opacity-5 pointer-events-none select-none font-black text-transparent stroke-white stroke-1" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
            THE_VOID
          </div>
          
          <span className="block text-[clamp(4rem,15vw,14rem)] relative">
            <GlitchText>NIKO</GlitchText>
          </span>
          <span className="block text-[clamp(4rem,15vw,14rem)] text-glitch-red -mt-[2vw] relative">
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

        <div className="mt-14 flex flex-wrap items-center gap-8">
          <Link
            href="/works"
            className="group relative inline-flex items-center gap-4 px-10 py-5 bg-bone text-void text-[11px] tracking-[0.4em] uppercase font-black hover:bg-glitch-red hover:text-bone transition-all duration-300"
          >
            <span className="absolute inset-0 bg-glitch-cyan -translate-x-1 -translate-y-1 -z-10 opacity-0 group-hover:opacity-40 transition-all" />
            ENTER_GALLERY
            <span className="group-hover:translate-x-2 transition-transform font-bold">
              →
            </span>
          </Link>
          <Link
            href="/sidequest"
            className="group inline-flex items-center gap-4 px-10 py-5 border border-white/10 text-[11px] tracking-[0.4em] uppercase text-ash hover:border-bone hover:text-bone transition-all"
          >
            SIDEQUEST_MODE
          </Link>

          {/* New aesthetic scroll indicator */}
          <div className="hidden xl:flex items-center gap-4 ml-auto opacity-30 hover:opacity-100 transition-opacity">
            <div className="w-12 h-[1px] bg-white/20" />
            <div className="text-[9px] tracking-[0.5em] flex flex-col items-end">
              <span>SCROLL_TO</span>
              <span className="text-glitch-red">EXPLORE</span>
            </div>
            <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center p-1">
              <div className="w-1 h-1 bg-bone rounded-full animate-bounce" />
            </div>
          </div>
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
