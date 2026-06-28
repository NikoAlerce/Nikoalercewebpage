"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import GlitchText from "./GlitchText";

const DclViewer = dynamic(() => import("./DclViewer"), { ssr: false });

// ──────────────────────────────────────────────
// Lazy-mount a 3D viewer only once it scrolls near the viewport, so the page
// never spins up several WebGL contexts at the same time.
// ──────────────────────────────────────────────
function LazyViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full h-full">
      {show ? (
        <DclViewer url={url} />
      ) : (
        <div className="w-full h-full grid place-items-center bg-gradient-to-b from-[#20222e] to-[#0b0c11] text-[10px] tracking-[0.4em] text-ash/40 uppercase">
          Loading 3D…
        </div>
      )}
    </div>
  );
}

function DclMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="dclg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff2d55" />
          <stop offset="1" stopColor="#ffb03a" />
        </linearGradient>
      </defs>
      <path d="M3 41 L22 9 L22 41 Z" fill="url(#dclg)" />
      <path d="M45 41 L24 15 L24 41 Z" fill="#ff2d55" opacity="0.85" />
      <circle cx="35" cy="13" r="4.5" fill="url(#dclg)" />
    </svg>
  );
}

// ── What I make ──
const OFFER = [
  { t: "Wearables", d: "Clothing, armor and accessories your avatar wears." },
  { t: "Builds", d: "Shops, galleries, clubs and full scenes to visit." },
  { t: "Emotes", d: "Custom dances and moves your avatar performs." },
];

// ── Case studies (real client work) ──
const CASES = [
  {
    client: "AMAIXEN",
    kicker: "Wearable collection",
    title: "Roman Armor",
    body: "A full set of wearable Roman armor for the AMAIXEN collective. Each piece is modeled and rigged to the Decentraland avatar so it moves naturally with every walk and emote — then optimized to fit DCL's strict polygon and texture budgets without losing the hammered-metal detail.",
    tags: ["Rigged to avatar", "DCL-optimized", "Female + Male"],
    models: [
      { label: "Armor ♀", url: "/dcl-armor-female.glb" },
      { label: "Armor ♂", url: "/dcl-armor-male.glb" },
      { label: "Boots ♀", url: "/dcl-boots-female.glb" },
      { label: "Boots ♂", url: "/dcl-boots-male.glb" },
    ],
  },
  {
    client: "ohde",
    kicker: "Wearable accessory",
    title: "Signature Backpack",
    body: "A backpack accessory designed for ohde — a clean, instantly recognizable silhouette that reads at avatar scale and holds up in a crowded scene. Built light so it never costs the wearer performance in-world.",
    tags: ["Accessory", "Low-poly", "DCL-optimized"],
    models: [{ label: "Backpack", url: "/dcl-ohde-backpack.glb" }],
  },
];

const PROMOS = [
  { src: "/promo2.mp4", title: "Promo · 01" },
  { src: "/promo3.mp4", title: "Promo · 02" },
];

const PRICING: {
  cat: string;
  blurb: string;
  rows: { tier: string; price: string; time: string }[];
}[] = [
  {
    cat: "BUILDS",
    blurb: "Scenes & venues — shops, galleries, clubs, full parcels.",
    rows: [
      { tier: "1×1 — Shop / Gallery / Club", price: "$650 – $950", time: "1 – 1.5 weeks" },
      { tier: "3×3", price: "$2,000 – $2,700", time: "3 – 4 weeks" },
      { tier: "5×5", price: "$4,000 – $4,800", time: "6 – 7 weeks" },
    ],
  },
  {
    cat: "WEARABLES",
    blurb: "Avatar gear — armor, outfits, accessories, props.",
    rows: [
      { tier: "Basic", price: "$550 – $700", time: "5 – 6 days" },
      { tier: "Medium", price: "$700 – $900", time: "1 – 1.5 weeks" },
      { tier: "Advanced", price: "$1,100 – $1,500", time: "1.5 – 2.5 weeks" },
    ],
  },
  {
    cat: "EMOTES",
    blurb: "Custom avatar animations, dances & signature moves.",
    rows: [
      { tier: "Basic", price: "$550 – $700", time: "5 – 6 days" },
      { tier: "Medium", price: "$700 – $950", time: "1 – 1.5 weeks" },
      { tier: "Advanced", price: "$1,000 – $1,400", time: "1.5 – 2 weeks" },
    ],
  },
];

const MAIL = "mailto:alercebolson@gmail.com?subject=Decentraland%20project%20inquiry";
const WORLD = "https://decentraland.org/jump/?realm=nikoalerce.dcl.eth";

// ──────────────────────────────────────────────
function CaseStudy({ c, flip }: { c: (typeof CASES)[number]; flip: boolean }) {
  const [active, setActive] = useState(c.models[0]);
  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
      {/* Viewer */}
      <div
        className={
          "relative h-[56vh] min-h-[400px] border border-white/10 overflow-hidden " +
          (flip ? "lg:order-2" : "")
        }
      >
        <LazyViewer url={active.url} />
      </div>

      {/* Text */}
      <div className={flip ? "lg:order-1" : ""}>
        <div className="text-[10px] tracking-[0.5em] text-glitch-cyan uppercase mb-3">
          {c.kicker} · for {c.client}
        </div>
        <h3 className="font-display font-black text-bone uppercase text-4xl md:text-5xl leading-[0.9] mb-5">
          {c.title}
        </h3>
        <p className="text-base text-ash/85 leading-relaxed max-w-lg mb-6">{c.body}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {c.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] tracking-[0.2em] uppercase border border-white/15 text-ash px-3 py-1.5"
            >
              {t}
            </span>
          ))}
        </div>

        {c.models.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {c.models.map((m) => (
              <button
                key={m.url}
                onClick={() => setActive(m)}
                className={
                  "px-4 py-2 text-[11px] tracking-[0.2em] uppercase border transition-colors " +
                  (active.url === m.url
                    ? "border-glitch-cyan text-glitch-cyan bg-glitch-cyan/5"
                    : "border-white/15 text-ash hover:text-bone hover:border-white/30")
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Decentraland() {
  return (
    <section
      id="decentraland"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1500px] mx-auto border-t border-white/5"
    >
      {/* ── Intro ── */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <DclMark />
          <div>
            <div className="text-[9px] tracking-[0.5em] text-ash uppercase">
              Official metaverse
            </div>
            <div className="font-display font-black text-xl text-bone tracking-tight">
              DECENTRALAND
            </div>
          </div>
        </div>

        <h2 className="font-display font-black text-bone uppercase leading-[0.85] text-[clamp(2.8rem,9vw,7rem)]">
          <GlitchText>I BUILD</GlitchText>
          <br />
          <span className="text-glitch-cyan">
            <GlitchText>THE METAVERSE</GlitchText>
          </span>
        </h2>

        <p className="mt-8 text-lg text-ash/85 leading-relaxed">
          Decentraland is a 3D virtual world you explore with your own avatar. I
          create the pieces that live inside it — the clothing and armor avatars
          wear, the buildings and galleries they walk through, and the emotes
          they perform. Everything is hand-modeled, rigged, and optimized to look
          great and run smoothly in-world.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={WORLD}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 border border-glitch-cyan/60 bg-glitch-cyan text-void hover:bg-bone transition-colors px-6 py-3 text-xs tracking-[0.3em] uppercase font-bold"
          >
            Visit my world ↗
          </a>
          <a
            href={MAIL}
            className="inline-flex items-center gap-3 border border-white/20 text-bone hover:border-glitch-cyan hover:text-glitch-cyan transition-colors px-6 py-3 text-xs tracking-[0.3em] uppercase font-bold"
          >
            Start a project →
          </a>
        </div>
      </div>

      {/* ── What I make ── */}
      <div className="grid sm:grid-cols-3 gap-3 md:gap-4 mt-16">
        {OFFER.map((o, i) => (
          <div key={o.t} className="border border-white/10 bg-void/40 p-6">
            <div className="text-[10px] tracking-[0.4em] text-glitch-cyan mb-3">
              // 0{i + 1}
            </div>
            <div className="font-display text-xl text-bone mb-2">{o.t}</div>
            <p className="text-[13px] text-ash leading-relaxed">{o.d}</p>
          </div>
        ))}
      </div>

      {/* ── Invitation: visit the live world ── */}
      <a
        href={WORLD}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mt-4 block overflow-hidden border border-glitch-cyan/40 bg-gradient-to-r from-glitch-cyan/10 via-void/40 to-void/40 hover:border-glitch-cyan transition-colors p-8 md:p-10"
      >
        <div className="absolute -right-6 -top-8 text-[8rem] font-black text-glitch-cyan/[0.06] leading-none select-none pointer-events-none">
          DCL
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-[10px] tracking-[0.5em] text-glitch-cyan uppercase mb-2">
              // Live now · my Decentraland world
            </div>
            <h3 className="font-display font-black text-bone uppercase text-2xl md:text-3xl leading-tight">
              Step inside and see what I can build
            </h3>
            <p className="text-sm text-ash/80 mt-2 max-w-lg">
              Walk through my world in-browser — builds, wearables and the whole
              vibe, live. No download needed.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-3 border border-glitch-cyan/60 bg-glitch-cyan text-void group-hover:bg-bone transition-colors px-6 py-4 text-xs tracking-[0.3em] uppercase font-bold">
            Enter my world ↗
          </span>
        </div>
      </a>

      {/* ── Case studies ── */}
      <div className="mt-24 md:mt-32 space-y-24 md:space-y-32">
        <div className="text-[10px] tracking-[0.6em] text-ash/50 uppercase">
          // Selected work · drag the models to look around
        </div>
        {CASES.map((c, i) => (
          <CaseStudy key={c.title} c={c} flip={i % 2 === 1} />
        ))}
      </div>

      {/* ── Promo videos ── */}
      <div className="mt-24 md:mt-32">
        <div className="text-[10px] tracking-[0.5em] text-glitch-cyan mb-2 uppercase">
          // See them in motion
        </div>
        <p className="text-ash/70 text-sm mb-6 max-w-xl">
          Promo pieces I produced for these drops — modeling, animation and edit.
        </p>
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {PROMOS.map((v) => (
            <div key={v.src} className="border border-white/10 bg-ink">
              <video
                src={v.src}
                controls
                loop
                muted
                playsInline
                preload="metadata"
                className="w-full aspect-video object-cover bg-black"
              />
              <div className="px-3 py-2 border-t border-white/5 text-[10px] tracking-[0.3em] text-ash uppercase">
                {v.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rates ── */}
      <div className="mt-24 md:mt-32">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] tracking-[0.5em] text-glitch-cyan uppercase mb-2">
              // Rates
            </div>
            <h3 className="font-display font-black text-bone uppercase text-3xl md:text-4xl">
              WORK WITH ME
            </h3>
          </div>
          <span className="text-[10px] tracking-[0.3em] border border-glitch-lime/40 bg-glitch-lime/5 text-glitch-lime px-3 py-1.5 uppercase">
            Availability · Project Dependent
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          {PRICING.map((p) => (
            <div key={p.cat} className="border border-white/10 bg-void/40 p-6">
              <div className="font-display font-black text-bone uppercase text-2xl mb-1">
                {p.cat}
              </div>
              <p className="text-[12px] text-ash leading-relaxed mb-5">{p.blurb}</p>
              <div className="space-y-3">
                {p.rows.map((r) => (
                  <div key={r.tier} className="border-t border-white/5 pt-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-bone font-medium">{r.tier}</span>
                      <span className="text-sm font-mono text-glitch-lime whitespace-nowrap">
                        {r.price}
                      </span>
                    </div>
                    <div className="text-[10px] tracking-[0.2em] text-ash/70 mt-0.5 uppercase">
                      {r.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-3 md:gap-4 text-[12px] text-ash/80 leading-relaxed">
          <p className="border-l-2 border-glitch-cyan/40 pl-4">
            Prices are subject to review based on the specific brief. Builds
            include 1–2 revision rounds; additional rounds are quoted separately.
          </p>
          <p className="border-l-2 border-glitch-cyan/40 pl-4">
            Wearables &amp; emotes cover full art and technical development. The
            Decentraland publishing / curation fee (~$100 USD in MANA per item)
            is covered by the client.
          </p>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-16 border border-white/10 bg-void/40 p-8 md:p-12 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-glitch-lime mb-3 uppercase">
            // Let&apos;s build
          </div>
          <h3 className="font-display font-black text-bone uppercase text-3xl md:text-5xl leading-[0.85] mb-4">
            YOUR METAVERSE
            <br />
            PRESENCE
          </h3>
          <p className="text-sm text-ash/85 max-w-md leading-relaxed">
            Tell me about your parcel, collection or event — I&apos;ll scope it,
            quote it, and ship assets that perform in-world.
          </p>
        </div>
        <a
          href={MAIL}
          className="group inline-flex items-center justify-center gap-3 whitespace-nowrap border border-glitch-lime/50 bg-glitch-lime/10 text-bone hover:bg-glitch-lime hover:text-void transition-colors px-8 py-5 text-xs tracking-[0.3em] uppercase font-bold"
        >
          START A PROJECT
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </section>
  );
}
