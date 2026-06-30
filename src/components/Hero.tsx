"use client";

import dynamic from "next/dynamic";

const HeroModel = dynamic(() => import("./HeroModel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center">
      <span className="text-ash/50 text-[10px] tracking-[0.5em] uppercase animate-pulse">Loading</span>
    </div>
  ),
});

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 62%, #1b1b21 0%, #0a0a0c 55%, #050506 100%)" }}
    >
      {/* The piece is the hero — single optimized GLB, studio-lit. */}
      <div className="absolute inset-0">
        <HeroModel className="absolute inset-0" />
      </div>

      {/* Soft top + bottom scrims so the type stays readable over the model. */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Kicker — top-left, quiet */}
      <div className="absolute top-28 md:top-32 left-6 md:left-12 z-10 pointer-events-none">
        <div className="flex items-center gap-3 text-[10px] md:text-[11px] tracking-[0.45em] uppercase text-ash/70">
          <span className="w-6 h-px bg-ash/40" />
          Multidisciplinary artist · Patagonia
        </div>
      </div>

      {/* Name wordmark — bottom, the anchor of the page */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 md:px-12 pb-16 md:pb-20 pointer-events-none">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="font-display font-semibold tracking-[-0.03em] leading-[0.9] text-bone">
            <span className="block text-[clamp(3.2rem,13vw,11rem)]">Niko Alerce</span>
          </h1>
          <div className="mt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <p className="text-sm md:text-base text-ash/80 max-w-md leading-relaxed font-light">
              3D art, music and immersive worlds — a single creative studio from El Bolsón, Patagonia.
            </p>
            <a
              href="#enter"
              className="pointer-events-auto group inline-flex items-center gap-3 text-[11px] tracking-[0.35em] uppercase text-bone/80 hover:text-bone transition-colors self-start md:self-auto"
            >
              <span className="w-8 h-px bg-bone/50 group-hover:w-12 transition-all" />
              Explore the work
            </a>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 opacity-40 pointer-events-none">
        <div className="w-5 h-9 border border-white/25 rounded-full flex justify-center p-1">
          <div className="w-1 h-1.5 bg-bone rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
