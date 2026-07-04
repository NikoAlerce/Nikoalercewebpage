"use client";

import TitleCharacter from "@/components/TitleCharacter";
import { useLang } from "@/lib/i18n";

// YouTube videos to feature. Titles can be edited freely.
const YOUTUBE = [
  { id: "GXFaNfs2b1k", title: "Más Empatías" },
  { id: "I4w5zEgMXtU", title: "Video — 02" },
];

// SoundCloud player embed URL helper.
const sc = (url: string, visual = false) =>
  `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}` +
  `&color=%23e3322b&auto_play=false&hide_related=true&show_comments=false` +
  `&show_user=true&show_reposts=false&show_teaser=false&visual=${visual}`;

const SOUNDCLOUD = [
  {
    label: "El Bosquecito Records",
    subKey: "scCatalogueSub" as const,
    url: "https://soundcloud.com/el-bosquecito-records",
    visual: true,
    height: 420,
  },
  {
    label: "DJ set · Casa Iori",
    subKey: "scLiveSub" as const,
    url: "https://soundcloud.com/al-er-ce/dj-set-casa-iori-2-feb-2023",
    visual: false,
    height: 166,
  },
];

const T = {
  en: {
    sectionTitle: "Music",
    description: "Original music produced, recorded, mixed and mastered in-house — hip-hop, trap, lo-fi and experimental electronic, released under my independent label El Bosquecito Records.",
    specLabel: "Label",
    specStreaming: "Streaming",
    specBase: "Base",
    videoLabel: "Video",
    scLabel: "SoundCloud",
    scCatalogueSub: "Label · full catalogue",
    scLiveSub: "Live set · Feb 2023",
    open: "Open ↗",
    servicesLabel: "Producer services",
    workWithMe: "Work with me",
    services: [
      "Music production & beatmaking",
      "Recording, mixing & mastering",
      "Sound design for video & 3D / XR",
      "Original scores & custom tracks",
    ],
    startProject: "Start a project",
  },
  es: {
    sectionTitle: "Música",
    description: "Música original producida, grabada, mezclada y masterizada in-house — hip-hop, trap, lo-fi y electrónica experimental, publicada bajo mi sello independiente El Bosquecito Records.",
    specLabel: "Sello",
    specStreaming: "Streaming",
    specBase: "Base",
    videoLabel: "Video",
    scLabel: "SoundCloud",
    scCatalogueSub: "Sello · catálogo completo",
    scLiveSub: "Set en vivo · Feb 2023",
    open: "Abrir ↗",
    servicesLabel: "Servicios de producción",
    workWithMe: "Trabajá conmigo",
    services: [
      "Producción musical y beatmaking",
      "Grabación, mezcla y mastering",
      "Diseño de sonido para video y 3D / XR",
      "Scores originales y tracks a medida",
    ],
    startProject: "Empezar un proyecto",
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <span className="w-8 h-px rule-accent" />
      <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
        {children}
      </span>
    </div>
  );
}

export default function Music() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section
      id="music"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-px rule-accent" />
            <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
              El Bosquecito Records
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.8rem,10vw,7rem)]">
              {t.sectionTitle}
            </h2>
            <TitleCharacter clip="hiphop" size={470} flip className="shrink-0" />
          </div>
          <p className="mt-6 max-w-xl text-[15px] md:text-base text-ash leading-relaxed">
            {t.description}
          </p>
        </div>
        <dl className="text-[12px] font-sans shrink-0 md:min-w-[16rem]">
          {[
            { k: t.specLabel, v: "El Bosquecito" },
            { k: t.specStreaming, v: "Spotify · Tidal · Deezer" },
            { k: t.specBase, v: "El Bolsón, AR" },
          ].map((r) => (
            <div
              key={r.k}
              className="flex justify-between gap-6 py-2 border-b border-white/8"
            >
              <dt className="text-ash tracking-[0.18em] uppercase text-[10px] self-center">
                {r.k}
              </dt>
              <dd className="text-bone text-right">{r.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ── Videos ── */}
      <SectionLabel>{t.videoLabel}</SectionLabel>
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
              <span className="text-sm font-medium text-bone group-hover:text-accent transition-colors truncate">
                {v.title}
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-[0.3em] uppercase text-ash hover:text-accent whitespace-nowrap"
              >
                YouTube ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── SoundCloud ── */}
      <SectionLabel>{t.scLabel}</SectionLabel>
      <div className="grid lg:grid-cols-2 gap-3 md:gap-4 mb-16">
        {SOUNDCLOUD.map((s) => (
          <div key={s.url} className="border border-white/10 bg-ink p-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-medium text-bone">{s.label}</div>
                <div className="text-[11px] text-ash">{t[s.subKey]}</div>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-[0.3em] uppercase text-ash hover:text-accent whitespace-nowrap"
              >
                {t.open}
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
          <SectionLabel>{t.servicesLabel}</SectionLabel>
          <h3 className="font-display text-bone text-3xl md:text-4xl leading-[0.95] mb-5">
            {t.workWithMe}
          </h3>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-[15px] text-bone/90">
            {t.services.map((s) => (
              <li key={s} className="flex items-start gap-2.5">
                <span className="text-accent mt-1.5 w-2 h-px shrink-0 bg-accent" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <a
          href="mailto:alercebolson@gmail.com?subject=Music%20production%20inquiry"
          className="group inline-flex items-center justify-center gap-3 whitespace-nowrap border border-bone/30 text-bone hover:bg-accent hover:border-accent hover:text-void transition-colors px-6 py-4 text-[11px] tracking-[0.25em] uppercase"
        >
          {t.startProject}
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </section>
  );
}
