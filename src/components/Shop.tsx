"use client";

import TitleCharacter from "@/components/TitleCharacter";
import { useLang } from "@/lib/i18n";

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
    id: "studio-tee",
    title: "Studio Tee",
    price: "USD 32",
    meta: "100% cotton · black",
    emoji: "▓",
    status: "available",
  },
  {
    id: "art-print",
    title: "Art Print — A2",
    price: "USD 45",
    meta: "Fine art · ed. 50",
    emoji: "▒",
    status: "available",
  },
  {
    id: "sticker-pack",
    title: "Sticker Pack — 06",
    price: "USD 12",
    meta: "Vinyl · die-cut",
    emoji: "░",
    status: "available",
  },
  {
    id: "sidequest-hoodie",
    title: "Sidequest Hoodie",
    price: "USD 78",
    meta: "Heavy-weight · 420g",
    emoji: "█",
    status: "soon",
  },
];

const T = {
  en: {
    kicker: "Store",
    sectionTitle: "Shop",
    description: "Physical objects from the studio — limited editions that carry the work into the analog world.",
    underConstruction: "Under construction · store not yet live",
    specShipping: "Shipping",
    specShippingVal: "Worldwide",
    specPayment: "Payment",
    specStock: "Stock",
    specStockVal: "Limited",
    inStock: "In stock",
    coming: "Coming",
    soldOut: "Sold out",
    addToCart: "Add to cart",
    notifyMe: "Notify me",
    checkoutNote: "Checkout integration ready — Stripe / Shopify / Tezos",
  },
  es: {
    kicker: "Tienda",
    sectionTitle: "Tienda",
    description: "Objetos físicos del estudio — ediciones limitadas que llevan la obra al mundo analógico.",
    underConstruction: "En construcción · tienda aún no activa",
    specShipping: "Envío",
    specShippingVal: "Mundial",
    specPayment: "Pago",
    specStock: "Stock",
    specStockVal: "Limitado",
    inStock: "En stock",
    coming: "Próximamente",
    soldOut: "Agotado",
    addToCart: "Agregar al carrito",
    notifyMe: "Avisame",
    checkoutNote: "Integración de checkout lista — Stripe / Shopify / Tezos",
  },
};

export default function Shop() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section
      id="shop"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-px rule-accent" />
            <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
              {t.kicker}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.8rem,10vw,7rem)]">
              {t.sectionTitle}
            </h2>
            <TitleCharacter clip="searching" size={470} flip className="shrink-0" />
          </div>
          <p className="mt-6 max-w-xl text-[15px] md:text-base text-ash leading-relaxed">
            {t.description}
          </p>
          <div className="mt-6 inline-flex items-center gap-3 border border-white/15 bg-white/[0.03] px-4 py-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-[10px] tracking-[0.3em] text-bone/80 uppercase">
              {t.underConstruction}
            </span>
          </div>
        </div>

        <dl className="text-[12px] font-sans shrink-0 md:min-w-[15rem]">
          {[
            { k: t.specShipping, v: t.specShippingVal },
            { k: t.specPayment, v: "Card · USDT · XTZ" },
            { k: t.specStock, v: t.specStockVal },
          ].map((r) => (
            <div
              key={r.k}
              className="flex justify-between gap-6 py-2 border-b border-white/8"
            >
              <dt className="text-ash tracking-[0.18em] uppercase text-[10px] self-center">
                {r.k}
              </dt>
              <dd className="text-bone">{r.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((p) => (
          <article
            key={p.id}
            className="group relative bg-ink border border-white/5 hover:border-accent/60 transition-colors"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-black grid place-items-center">
              <div className="text-[18rem] leading-none text-white/5 select-none group-hover:text-accent/10 transition-colors font-mono">
                {p.emoji}
              </div>
              <div className="absolute top-2 left-2 text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 bg-void/80 border border-white/10 text-ash">
                {p.status === "available"
                  ? t.inStock
                  : p.status === "soon"
                  ? t.coming
                  : t.soldOut}
              </div>
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium text-bone group-hover:text-accent transition-colors truncate">
                  {p.title}
                </h3>
                <span className="text-[11px] text-ash whitespace-nowrap">
                  {p.price}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ash">{p.meta}</p>

              <button
                disabled={p.status !== "available"}
                className="mt-4 w-full text-[11px] tracking-[0.2em] uppercase border border-white/10 px-3 py-2 hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-ash transition-colors"
              >
                {p.status === "available"
                  ? t.addToCart
                  : p.status === "soon"
                  ? t.notifyMe
                  : "—"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-[11px] tracking-[0.2em] uppercase text-ash/60 text-center">
        {t.checkoutNote}
      </p>
    </section>
  );
}
