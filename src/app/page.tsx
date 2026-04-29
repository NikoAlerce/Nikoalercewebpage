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
        <div className="relative flex items-center gap-6 mb-16">
          <div className="text-[11px] tracking-[0.8em] text-glitch-gold uppercase font-black">
            // INDEX_OF_REALMS
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-glitch-gold/40 to-transparent" />
        </div>
        <div className="grid md:grid-cols-3 gap-3 md:gap-4">
          <Link
            href="/works"
            className="group relative block border border-white/5 bg-void p-10 md:p-14 overflow-hidden hover:border-glitch-gold/50 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div className="absolute -right-8 -top-8 text-[12rem] font-black text-white/5 leading-none select-none pointer-events-none">01</div>
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-glitch-gold mb-6">
                // GALLERY_CORE
              </div>
              <div className="font-display font-black text-bone uppercase leading-[0.8] text-6xl md:text-8xl mb-6 group-hover:text-glitch-gold transition-colors">
                WORKS
              </div>
              <p className="text-[13px] text-ash mb-10 max-w-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                Main gallery synced live with Tezos. 3D animations, glitch, and
                pieces available for collection.
              </p>
              <div className="text-[11px] tracking-[0.5em] text-bone group-hover:text-glitch-gold flex items-center gap-3 font-bold">
                ACCESS_SYSTEM <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/sidequest"
            className="group relative block border border-white/5 bg-void p-10 md:p-14 overflow-hidden hover:border-glitch-jade/50 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div className="absolute -right-8 -top-8 text-[12rem] font-black text-white/5 leading-none select-none pointer-events-none">02</div>
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-glitch-jade mb-6">
                // ALTER_EGO
              </div>
              <div className="font-display font-black text-bone uppercase leading-[0.8] text-6xl md:text-8xl mb-6 group-hover:text-glitch-jade transition-colors">
                SIDE<br />QUEST
              </div>
              <p className="text-[13px] text-ash mb-10 max-w-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                Experimental mode. Iterations, drafts, and errors that
                became finished pieces.
              </p>
              <div className="text-[11px] tracking-[0.5em] text-bone group-hover:text-glitch-jade flex items-center gap-3 font-bold">
                ACCESS_SYSTEM <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/shop"
            className="group relative block border border-white/5 bg-void p-10 md:p-14 overflow-hidden hover:border-glitch-terra/50 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div className="absolute -right-8 -top-8 text-[12rem] font-black text-white/5 leading-none select-none pointer-events-none">03</div>
            <div className="relative">
              <div className="text-[10px] tracking-[0.4em] text-ash mb-6">
                // MARKET_VOID
              </div>
              <div className="font-display font-black text-bone uppercase leading-[0.8] text-6xl md:text-8xl mb-6 group-hover:text-glitch-terra transition-colors">
                SHOP
              </div>
              <p className="text-[13px] text-ash mb-10 max-w-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                Physical objects: prints, sculptures, limited drops with their
                digital counterparts.
              </p>
              <div className="text-[11px] tracking-[0.5em] text-bone group-hover:text-glitch-terra flex items-center gap-3 font-bold">
                ACCESS_SYSTEM <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
