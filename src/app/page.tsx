"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Hero from "@/components/Hero";
import About from "@/components/About";
import GlitchText from "@/components/GlitchText";
import { playClickSound } from "@/lib/sound";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"splash" | "web" | null>(null);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("niko_void_mode");
      if (saved === "web") {
        setMode("web");
      } else {
        setMode("splash");
      }
    }
  }, []);

  const selectWeb = () => {
    playClickSound();
    setGlitching(true);
    setTimeout(() => {
      sessionStorage.setItem("niko_void_mode", "web");
      setMode("web");
      setGlitching(false);
    }, 800);
  };

  const selectMetaverse = () => {
    playClickSound();
    setGlitching(true);
    setTimeout(() => {
      sessionStorage.setItem("niko_void_mode", "web"); // default back to web if they click home later
      router.push("/metaverse");
    }, 600);
  };

  if (mode === null) {
    return <div className="fixed inset-0 bg-black z-[100]" />;
  }

  if (mode === "splash") {
    return (
      <div className={`fixed inset-0 bg-black z-[100] flex flex-col justify-center items-center px-6 md:px-12 select-none overflow-hidden transition-opacity duration-700 ${glitching ? "animate-pulse opacity-80" : ""}`}>
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15]" 
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,0,64,0.15) 0 1px, transparent 1px 3px)",
            mixBlendMode: "screen"
          }}
        />

        <div className="relative text-center max-w-4xl space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <div className="text-[10px] md:text-xs tracking-[0.8em] text-glitch-red uppercase font-black">
              // INITIALIZATION_SEQUENCE_DECRYPTED
            </div>
            <h1 className="font-display font-black text-bone text-4xl md:text-7xl uppercase leading-none tracking-tight">
              <GlitchText>NIKO ALERCE</GlitchText>
              <br />
              <span className="text-glitch-cyan">
                <GlitchText>THE VOID</GlitchText>
              </span>
            </h1>
            <p className="text-xs md:text-sm text-ash max-w-md mx-auto leading-relaxed tracking-widest opacity-60">
              3D ART · MUSIC · METAVERSE — A FULL-STACK CREATIVE STUDIO
            </p>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
            {/* option 1: web portfolio */}
            <button
              onClick={selectWeb}
              className="group relative text-left border border-white/10 bg-void/50 p-8 hover:border-glitch-red/50 hover:bg-glitch-red/5 transition-all duration-300 cursor-pointer overflow-hidden outline-none"
            >
              <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />
              <div className="absolute -right-6 -top-6 text-[8rem] font-black text-white/[0.02] leading-none select-none pointer-events-none group-hover:text-glitch-red/5 transition-colors font-mono">01</div>
              <div className="relative space-y-4">
                <div className="text-[9px] tracking-[0.4em] text-glitch-red font-bold uppercase font-mono">
                  // OPTION_01
                </div>
                <h3 className="font-display font-black text-bone text-2xl uppercase group-hover:text-glitch-red transition-colors">
                  WEB PORTFOLIO
                </h3>
                <p className="text-[12px] text-ash/80 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                  Access the standard brutalist portfolio. Browse artwork records, physical shop, and sync live Tezos gallery.
                </p>
                <div className="text-[10px] tracking-[0.3em] text-bone font-mono font-bold pt-2 group-hover:text-glitch-red transition-colors">
                  ACCESS_PORTAL_WEB →
                </div>
              </div>
            </button>

            {/* option 2: metaverse */}
            <button
              onClick={selectMetaverse}
              className="group relative text-left border border-white/10 bg-void/50 p-8 hover:border-glitch-cyan/50 hover:bg-glitch-cyan/5 transition-all duration-300 cursor-pointer overflow-hidden outline-none"
            >
              <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />
              <div className="absolute -right-6 -top-6 text-[8rem] font-black text-white/[0.02] leading-none select-none pointer-events-none group-hover:text-glitch-cyan/5 transition-colors font-mono">02</div>
              <div className="relative space-y-4">
                <div className="text-[9px] tracking-[0.4em] text-glitch-cyan font-bold uppercase font-mono">
                  // OPTION_02
                </div>
                <h3 className="font-display font-black text-bone text-2xl uppercase group-hover:text-glitch-cyan transition-colors">
                  3D METAVERSE
                </h3>
                <p className="text-[12px] text-ash/80 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                  Enter the real-time first-person virtual gallery. Explore the raw GLTF environment, view details, and collect artwork.
                </p>
                <div className="text-[10px] tracking-[0.3em] text-bone font-mono font-bold pt-2 group-hover:text-glitch-cyan transition-colors">
                  ENTER_METAVERSE_3D →
                </div>
              </div>
            </button>
          </div>

          {/* Footer warning */}
          <div className="text-[9px] font-mono tracking-[0.3em] text-ash/40">
            WARNING :: SYSTEM REQUIRES WEBGL2 CAPABILITIES FOR IMMERSIVE ENVIRONMENTS
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <About />

      {/* Bridge to interior pages */}
      <section
        id="enter"
        className="relative py-28 md:py-36 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
      >
        <div className="relative flex items-center gap-6 mb-16">
          <div className="text-[11px] tracking-[0.8em] text-glitch-red uppercase font-black">
            // INDEX_OF_REALMS
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-glitch-red/40 to-transparent" />
        </div>
        <div className="grid md:grid-cols-3 gap-3 md:gap-4">
          <Link
            href="/works"
            className="group relative block border border-white/5 bg-void p-10 md:p-14 overflow-hidden hover:border-glitch-red/50 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div className="absolute -right-8 -top-8 text-[12rem] font-black text-white/5 leading-none select-none pointer-events-none">01</div>
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-glitch-red mb-6">
                // GALLERY_CORE
              </div>
              <div className="font-display font-black text-bone uppercase leading-[0.8] text-6xl md:text-8xl mb-6 group-hover:text-glitch-red transition-colors">
                WORKS
              </div>
              <p className="text-[13px] text-ash mb-10 max-w-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                Main gallery synced live with Tezos. 3D animations, glitch, and
                pieces available for collection.
              </p>
              <div className="text-[11px] tracking-[0.5em] text-bone group-hover:text-glitch-red flex items-center gap-3 font-bold">
                ACCESS_SYSTEM <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/sidequest"
            className="group relative block border border-white/5 bg-void p-10 md:p-14 overflow-hidden hover:border-glitch-cyan/50 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div className="absolute -right-8 -top-8 text-[12rem] font-black text-white/5 leading-none select-none pointer-events-none">02</div>
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-glitch-cyan mb-6">
                // ALTER_EGO
              </div>
              <div className="font-display font-black text-bone uppercase leading-[0.8] text-6xl md:text-8xl mb-6 group-hover:text-glitch-cyan transition-colors">
                SIDE<br />QUEST
              </div>
              <p className="text-[13px] text-ash mb-10 max-w-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                Experimental mode. Iterations, drafts, and errors that
                became finished pieces.
              </p>
              <div className="text-[11px] tracking-[0.5em] text-bone group-hover:text-glitch-cyan flex items-center gap-3 font-bold">
                ACCESS_SYSTEM <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/shop"
            className="group relative block border border-white/5 bg-void p-10 md:p-14 overflow-hidden hover:border-white/30 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div className="absolute -right-8 -top-8 text-[12rem] font-black text-white/5 leading-none select-none pointer-events-none">03</div>
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-ash mb-6">
                // MARKET_VOID
              </div>
              <div className="font-display font-black text-bone uppercase leading-[0.8] text-6xl md:text-8xl mb-6 group-hover:text-white transition-colors">
                SHOP
              </div>
              <p className="text-[13px] text-ash mb-10 max-w-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                Physical objects: prints, sculptures, limited drops with their
                digital counterparts.
              </p>
              <div className="text-[11px] tracking-[0.5em] text-bone group-hover:text-white flex items-center gap-3 font-bold">
                ACCESS_SYSTEM <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
