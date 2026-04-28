"use client";

import GlitchText from "./GlitchText";

type Product = {
  id: string;
  title: string;
  price: string;
  meta: string;
  emoji: string;
  status: "available" | "soon" | "sold";
};

const products: Product[] = [
  {
    id: "void-tee",
    title: "VOID // T-SHIRT",
    price: "USD 32",
    meta: "100% COTTON · BLACK",
    emoji: "▓",
    status: "available",
  },
  {
    id: "glitch-print",
    title: "GLITCH PRINT A2",
    price: "USD 45",
    meta: "FINE_ART · ED. 50",
    emoji: "▒",
    status: "available",
  },
  {
    id: "sticker-pack",
    title: "STICKER_PACK · 06",
    price: "USD 12",
    meta: "VINYL · DIE-CUT",
    emoji: "░",
    status: "available",
  },
  {
    id: "sidequest-hoodie",
    title: "SIDEQUEST HOODIE",
    price: "USD 78",
    meta: "HEAVY_WEIGHT · 420g",
    emoji: "█",
    status: "soon",
  },
];

export default function Shop() {
  return (
    <section
      id="shop"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="relative">
          <div className="absolute -top-16 -left-8 text-[12rem] font-black text-white/[0.03] select-none pointer-events-none leading-none z-0">
            SHOP
          </div>
          <div className="text-[11px] tracking-[0.8em] mb-4 font-black text-glitch-lime relative z-10 uppercase">
            // PHYSICAL_GOODS_SYNC
          </div>
          <h2 className="font-display font-black text-bone uppercase leading-[0.8] text-[clamp(3.5rem,12vw,10rem)] relative z-10">
            <GlitchText>SHOP</GlitchText>
          </h2>
          <p className="mt-6 max-w-xl text-base text-ash/80 relative z-10 leading-relaxed">
            Physical objects from the NIKO_ALERCE universe. Limited editions
            that extend the glitch into the analog world.
          </p>
        </div>
        <div className="text-[10px] tracking-[0.3em] text-ash space-y-1 border-l border-glitch-lime/30 pl-4">
          <div className="flex justify-between gap-6">
            <span>SHIPPING</span>
            <span className="text-bone">WORLDWIDE</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>PAYMENT</span>
            <span className="text-bone">CARD · USDT · XTZ</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>STOCK</span>
            <span className="text-glitch-lime">LIMITED</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((p) => (
          <article
            key={p.id}
            className="group relative bg-ink border border-white/5 hover:border-glitch-lime/60 transition-colors"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-black grid place-items-center">
              <div className="text-[18rem] leading-none text-white/5 select-none group-hover:text-glitch-lime/10 transition-colors font-mono">
                {p.emoji}
              </div>
              <div className="absolute top-2 left-2 text-[9px] tracking-[0.2em] px-1.5 py-0.5 bg-void/80 border border-white/10">
                {p.status === "available"
                  ? "IN_STOCK"
                  : p.status === "soon"
                  ? "COMING"
                  : "SOLD_OUT"}
              </div>
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, rgba(163,255,0,0.04) 0 1px, transparent 1px 3px)",
                  mixBlendMode: "screen",
                }}
              />
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-medium text-bone group-hover:text-glitch-lime transition-colors truncate">
                  {p.title}
                </h3>
                <span className="text-[11px] text-ash whitespace-nowrap">
                  {p.price}
                </span>
              </div>
              <p className="mt-1 text-[10px] tracking-[0.2em] text-ash">
                {p.meta}
              </p>

              <button
                disabled={p.status !== "available"}
                className="mt-4 w-full text-[11px] tracking-[0.3em] uppercase border border-white/10 px-3 py-2 hover:border-glitch-lime hover:text-glitch-lime disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-ash transition-colors"
              >
                {p.status === "available"
                  ? "ADD_TO_CART"
                  : p.status === "soon"
                  ? "NOTIFY_ME"
                  : "—"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-[11px] tracking-[0.25em] text-ash text-center">
        // CHECKOUT INTEGRATION READY (STRIPE / SHOPIFY / TZ-ENABLED)
      </p>
    </section>
  );
}
