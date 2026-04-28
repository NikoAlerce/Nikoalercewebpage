import Link from "next/link";
import Hero from "@/components/Hero";
import About from "@/components/About";

export default function Home() {
  return (
    <>
      <Hero />
      <About />

      {/* Bridge to interior pages */}
      <section
        id="enter"
        className="relative py-28 md:py-36 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
      >
        <div className="text-[10px] tracking-[0.5em] text-glitch-red mb-6">
          // ENTER
        </div>
        <div className="grid md:grid-cols-3 gap-3 md:gap-4">
          <Link
            href="/works"
            className="group relative block border border-white/10 bg-void p-8 md:p-10 overflow-hidden hover:border-glitch-red transition-colors"
          >
            <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-glitch-red mb-4">
                // 01
              </div>
              <div className="font-display font-bold text-bone uppercase leading-none text-4xl md:text-5xl mb-3 group-hover:translate-x-1 transition-transform">
                WORKS
              </div>
              <p className="text-sm text-ash mb-8 max-w-xs leading-relaxed">
                Main gallery synced live with Tezos. 3D animations, glitch, and
                pieces available for collection.
              </p>
              <div className="text-[11px] tracking-[0.4em] text-bone group-hover:text-glitch-red flex items-center gap-2">
                ENTER <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/sidequest"
            className="group relative block border border-white/10 bg-void p-8 md:p-10 overflow-hidden hover:border-glitch-cyan transition-colors"
          >
            <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-glitch-cyan mb-4">
                // 02
              </div>
              <div className="font-display font-bold text-bone uppercase leading-none text-4xl md:text-5xl mb-3 group-hover:translate-x-1 transition-transform">
                SIDE/QUEST
              </div>
              <p className="text-sm text-ash mb-8 max-w-xs leading-relaxed">
                Experimental alter ego. Iterations, drafts, and errors that
                became finished pieces.
              </p>
              <div className="text-[11px] tracking-[0.4em] text-bone group-hover:text-glitch-cyan flex items-center gap-2">
                ENTER <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/shop"
            className="group relative block border border-white/10 bg-void p-8 md:p-10 overflow-hidden hover:border-bone transition-colors"
          >
            <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-ash mb-4">
                // 03
              </div>
              <div className="font-display font-bold text-bone uppercase leading-none text-4xl md:text-5xl mb-3 group-hover:translate-x-1 transition-transform">
                SHOP
              </div>
              <p className="text-sm text-ash mb-8 max-w-xs leading-relaxed">
                Physical objects: prints, sculptures, limited drops with their
                digital counterparts.
              </p>
              <div className="text-[11px] tracking-[0.4em] text-bone group-hover:text-bone flex items-center gap-2">
                ENTER <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
