"use client";

import GlitchText from "./GlitchText";

// YouTube videos to feature. Titles can be edited freely.
const YOUTUBE = [
  { id: "GXFaNfs2b1k", title: "MÁS EMPATÍAS" },
  { id: "I4w5zEgMXtU", title: "VIDEO // 02" },
];

// SoundCloud player embed URL helper.
const sc = (url: string, visual = false) =>
  `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}` +
  `&color=%23ff0040&auto_play=false&hide_related=true&show_comments=false` +
  `&show_user=true&show_reposts=false&show_teaser=false&visual=${visual}`;

const SOUNDCLOUD = [
  {
    label: "EL BOSQUECITO RECORDS",
    sub: "Label · full catalogue",
    url: "https://soundcloud.com/el-bosquecito-records",
    visual: true,
    height: 420,
  },
  {
    label: "DJ SET · CASA IORI",
    sub: "Live set · Feb 2023",
    url: "https://soundcloud.com/al-er-ce/dj-set-casa-iori-2-feb-2023",
    visual: false,
    height: 166,
  },
];

const SERVICES = [
  "Music production & beatmaking",
  "Recording, mixing & mastering",
  "Sound design for video & 3D / XR",
  "Original scores & custom tracks",
];

export default function Music() {
  return (
    <section
      id="music"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
        <div className="relative">
          <div className="absolute -top-16 -left-8 text-[12rem] font-black text-white/[0.03] select-none pointer-events-none leading-none z-0">
            SOUND
          </div>
          <div className="text-[11px] tracking-[0.8em] mb-4 font-black text-glitch-red relative z-10 uppercase">
            // EL_BOSQUECITO_RECORDS
          </div>
          <h2 className="font-display font-black text-bone uppercase leading-[0.8] text-[clamp(3.5rem,12vw,10rem)] relative z-10">
            <GlitchText>MUSIC</GlitchText>
          </h2>
          <p className="mt-6 max-w-xl text-base text-ash/80 relative z-10 leading-relaxed">
            Original music produced, recorded, mixed and mastered in-house —
            hip-hop, trap, lo-fi and experimental electronic, released under my
            independent label El Bosquecito Records.
          </p>
        </div>
        <div className="text-[10px] tracking-[0.3em] text-ash space-y-1 border-l border-glitch-red/30 pl-4">
          <div className="flex justify-between gap-6">
            <span>LABEL</span>
            <span className="text-bone">EL BOSQUECITO</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>STREAMING</span>
            <span className="text-bone">SPOTIFY · TIDAL · DEEZER</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>BASE</span>
            <span className="text-bone">EL BOLSÓN, AR</span>
          </div>
        </div>
      </div>

      {/* ── Videos ── */}
      <div className="text-[10px] tracking-[0.5em] text-glitch-cyan mb-5 uppercase">
        // VIDEO
      </div>
      <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-16">
        {YOUTUBE.map((v) => (
          <div key={v.id} className="border border-white/10 bg-ink group">
            <div className="aspect-video relative overflow-hidden bg-black">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between gap-3 p-3 border-t border-white/5">
              <span className="text-xs font-medium text-bone group-hover:text-glitch-red transition-colors truncate">
                {v.title}
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-[0.3em] text-ash hover:text-glitch-red whitespace-nowrap"
              >
                YOUTUBE ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── SoundCloud ── */}
      <div className="text-[10px] tracking-[0.5em] text-glitch-cyan mb-5 uppercase">
        // SOUNDCLOUD
      </div>
      <div className="grid lg:grid-cols-2 gap-3 md:gap-4 mb-16">
        {SOUNDCLOUD.map((s) => (
          <div key={s.url} className="border border-white/10 bg-ink p-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-xs font-medium text-bone">{s.label}</div>
                <div className="text-[10px] tracking-[0.2em] text-ash">{s.sub}</div>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-[0.3em] text-ash hover:text-glitch-red whitespace-nowrap"
              >
                OPEN ↗
              </a>
            </div>
            <iframe
              className="w-full block"
              style={{ height: s.height }}
              src={sc(s.url, s.visual)}
              title={s.label}
              loading="lazy"
              allow="autoplay"
              scrolling="no"
              frameBorder="no"
            />
          </div>
        ))}
      </div>

      {/* ── Producer services ── */}
      <div className="border border-white/10 bg-void/40 p-6 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-glitch-lime mb-3 uppercase">
            // SERVICES · PRODUCER
          </div>
          <h3 className="font-display font-black text-bone uppercase text-3xl md:text-4xl leading-[0.9] mb-5">
            WORK WITH ME
          </h3>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-bone/90">
            {SERVICES.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="text-glitch-red mt-1">▌</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <a
          href="mailto:alercebolson@gmail.com?subject=Music%20production%20inquiry"
          className="group inline-flex items-center justify-center gap-3 whitespace-nowrap border border-glitch-lime/50 bg-glitch-lime/10 text-bone hover:bg-glitch-lime hover:text-void transition-colors px-6 py-4 text-xs tracking-[0.3em] uppercase font-bold"
        >
          START A PROJECT
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </section>
  );
}
