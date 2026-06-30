"use client";

import dynamic from "next/dynamic";

const HeroExperience = dynamic(() => import("./HeroExperience"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center">
      <span className="text-ash/50 text-[10px] tracking-[0.5em] uppercase animate-pulse">Loading</span>
    </div>
  ),
});

// Fine film grain (tasteful, not glitch) — adds a premium, photographed texture.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] w-full overflow-hidden bg-black">
      {/* Pure-black stage. The "magic" (drifting motes + bloom) lives inside the 3D scene. */}
      <div className="absolute inset-0">
        <HeroExperience className="absolute inset-0" />
      </div>

      {/* Cinematic scrims for type legibility over the busy scene. */}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/75 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
      {/* Extra weight under the lower-left wordmark so it always reads. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(120% 90% at 0% 100%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 55%)" }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />

      {/* Kicker — top-left */}
      <div className="absolute top-28 md:top-32 left-6 md:left-12 z-10 pointer-events-none animate-fade-up max-w-[min(20rem,calc(100vw-3rem))] md:max-w-none" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-start md:items-center gap-3 font-sans text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-bone/85 leading-relaxed">
          <span className="w-7 h-px bg-accent shrink-0 mt-1.5 md:mt-0" />
          <span>
            Multidisciplinary artist <span className="text-accent">·</span> Patagonia
          </span>
        </div>
      </div>

      {/* Wordmark — bottom-left (the 3D labels are the navigation now) */}
      <div className="absolute bottom-0 left-0 z-10 px-6 md:px-12 pb-12 md:pb-16 pointer-events-none animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <span className="block w-10 h-px bg-accent mb-5" />
        <h1
          className="font-graffiti leading-[0.95] text-bone text-[clamp(3rem,9vw,7rem)]"
          style={{ textShadow: "0 2px 30px rgba(0,0,0,0.55)" }}
        >
          Niko Alerce
        </h1>
        <p
          className="mt-4 font-sans text-sm md:text-[15px] text-bone/75 max-w-sm leading-relaxed"
          style={{ textShadow: "0 1px 16px rgba(0,0,0,0.6)" }}
        >
          3D art, animation, music &amp; immersive worlds — one studio from El Bolsón, Patagonia.
        </p>
      </div>

      {/* Scroll cue — bottom-right, quiet. */}
      <div className="absolute bottom-12 md:bottom-16 right-6 md:right-12 z-10 pointer-events-none hidden sm:flex items-center gap-3 text-bone/45 animate-fade-up" style={{ animationDelay: "0.5s" }}>
        <span className="font-sans text-[10px] tracking-[0.35em] uppercase">Scroll</span>
        <span className="w-px h-8 bg-gradient-to-b from-bone/50 to-transparent" />
      </div>
    </section>
  );
}
