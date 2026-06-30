"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

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
        <div className="w-full h-full grid place-items-center bg-gradient-to-b from-[#1a1a1c] to-[#0b0b0c] text-[10px] tracking-[0.4em] text-ash/40 uppercase">
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
          <stop offset="0" stopColor="#ff5a4d" />
          <stop offset="1" stopColor="#b21e1a" />
        </linearGradient>
      </defs>
      <path d="M3 41 L22 9 L22 41 Z" fill="url(#dclg)" />
      <path d="M45 41 L24 15 L24 41 Z" fill="#e3322b" opacity="0.85" />
      <circle cx="35" cy="13" r="4.5" fill="url(#dclg)" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="w-8 h-px rule-accent" />
      <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
        {children}
      </span>
    </div>
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
    cat: "Builds",
    blurb: "Scenes & venues — shops, galleries, clubs, full parcels.",
    rows: [
      { tier: "1×1 — Shop / Gallery / Club", price: "$650 – $950", time: "1 – 1.5 weeks" },
      { tier: "3×3", price: "$2,000 – $2,700", time: "3 – 4 weeks" },
      { tier: "5×5", price: "$4,000 – $4,800", time: "6 – 7 weeks" },
    ],
  },
  {
    cat: "Wearables",
    blurb: "Avatar gear — armor, outfits, accessories, props.",
    rows: [
      { tier: "Basic", price: "$550 – $700", time: "5 – 6 days" },
      { tier: "Medium", price: "$700 – $900", time: "1 – 1.5 weeks" },
      { tier: "Advanced", price: "$1,100 – $1,500", time: "1.5 – 2.5 weeks" },
    ],
  },
  {
    cat: "Emotes",
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
        <div className="font-sans text-[11px] tracking-[0.35em] uppercase text-ash mb-3">
          {c.kicker} · for {c.client}
        </div>
        <h3 className="font-display text-bone text-4xl md:text-5xl leading-[0.95] mb-5">
          {c.title}
        </h3>
        <p className="text-[15px] md:text-base text-ash leading-relaxed max-w-lg mb-6">{c.body}</p>

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
                    ? "border-accent text-accent bg-accent/5"
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
            <div className="font-display text-xl text-bone">
              Decentraland
            </div>
          </div>
        </div>

        <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.8rem,9vw,6.5rem)]">
          I build
          <br />
          <span className="text-accent">the metaverse.</span>
        </h2>

        <p className="mt-8 text-lg text-ash leading-relaxed">
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
            className="inline-flex items-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-6 py-3 text-[11px] tracking-[0.25em] uppercase"
          >
            Visit my world ↗
          </a>
          <a
            href={MAIL}
            className="inline-flex items-center gap-3 border border-white/20 text-bone hover:border-accent hover:text-accent transition-colors px-6 py-3 text-[11px] tracking-[0.25em] uppercase"
          >
            Start a project →
          </a>
        </div>
      </div>

      {/* ── What I make ── */}
      <div className="grid sm:grid-cols-3 gap-px bg-white/5 border border-white/5 mt-16">
        {OFFER.map((o, i) => (
          <div key={o.t} className="group bg-void hover:bg-ink transition-colors duration-500 p-6">
            <div className="font-mono text-[11px] tracking-[0.3em] text-ash/60 group-hover:text-accent transition-colors">
              0{i + 1}
            </div>
            <div className="mt-5 font-display text-xl text-bone mb-2">{o.t}</div>
            <p className="text-[13px] text-ash leading-relaxed">{o.d}</p>
          </div>
        ))}
      </div>

      {/* ── Invitation: visit the live world ── */}
      <a
        href={WORLD}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mt-4 block overflow-hidden border border-white/10 bg-ink hover:border-accent/60 transition-colors p-8 md:p-10"
      >
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-ash">
                Live now · my Decentraland world
              </span>
            </div>
            <h3 className="font-display text-bone text-2xl md:text-3xl leading-tight">
              Step inside and see what I can build
            </h3>
            <p className="text-sm text-ash mt-3 max-w-lg">
              Walk through my world in-browser — builds, wearables and the whole
              vibe, live. No download needed.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-3 border border-bone/30 text-bone group-hover:bg-accent group-hover:border-accent group-hover:text-void transition-colors px-6 py-4 text-[11px] tracking-[0.25em] uppercase">
            Enter my world ↗
          </span>
        </div>
      </a>

      {/* ── Case studies ── */}
      <div className="mt-24 md:mt-32 space-y-24 md:space-y-32">
        <SectionLabel>Selected work · drag the models to look around</SectionLabel>
        {CASES.map((c, i) => (
          <CaseStudy key={c.title} c={c} flip={i % 2 === 1} />
        ))}
      </div>

      {/* ── Promo videos ── */}
      <div className="mt-24 md:mt-32">
        <SectionLabel>See them in motion</SectionLabel>
        <p className="text-ash text-sm mb-6 max-w-xl">
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
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <SectionLabel>Rates</SectionLabel>
            <h3 className="font-display text-bone text-3xl md:text-4xl">
              Work with me
            </h3>
          </div>
          <span className="text-[10px] tracking-[0.25em] uppercase border border-white/15 bg-white/[0.03] text-bone/80 px-3 py-1.5">
            Availability · project dependent
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          {PRICING.map((p) => (
            <div key={p.cat} className="border border-white/10 bg-void/40 p-6">
              <div className="font-display text-bone text-2xl mb-1">
                {p.cat}
              </div>
              <p className="text-[12px] text-ash leading-relaxed mb-5">{p.blurb}</p>
              <div className="space-y-3">
                {p.rows.map((r) => (
                  <div key={r.tier} className="border-t border-white/5 pt-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-bone font-medium">{r.tier}</span>
                      <span className="text-sm font-mono text-bone whitespace-nowrap">
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

        <div className="mt-6 grid md:grid-cols-2 gap-3 md:gap-4 text-[12px] text-ash leading-relaxed">
          <p className="border-l-2 border-accent/50 pl-4">
            Prices are subject to review based on the specific brief. Builds
            include 1–2 revision rounds; additional rounds are quoted separately.
          </p>
          <p className="border-l-2 border-accent/50 pl-4">
            Wearables &amp; emotes cover full art and technical development. The
            Decentraland publishing / curation fee (~$100 USD in MANA per item)
            is covered by the client.
          </p>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-16 border border-white/10 bg-void/40 p-8 md:p-12 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <SectionLabel>Let&apos;s build</SectionLabel>
          <h3 className="font-display text-bone text-3xl md:text-5xl leading-[0.95] mb-4">
            Your metaverse presence
          </h3>
          <p className="text-sm text-ash max-w-md leading-relaxed">
            Tell me about your parcel, collection or event — I&apos;ll scope it,
            quote it, and ship assets that perform in-world.
          </p>
        </div>
        <a
          href={MAIL}
          className="group inline-flex items-center justify-center gap-3 whitespace-nowrap border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-8 py-5 text-[11px] tracking-[0.25em] uppercase"
        >
          Start a project
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </section>
  );
}
