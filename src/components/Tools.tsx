"use client";

import TitleCharacter from "@/components/TitleCharacter";
import { useLang } from "@/lib/i18n";

// Each tool I make and share. Edit copy freely — `blurb` is the pitch, `points` the
// bullet features, `cta` the button label, `href` the link, `price` optional.
const TOOLS = {
  en: [
    {
      kicker: "Blender addon",
      title: "Video to GLB Texture",
      blurb:
        "A Blender addon that bakes a video straight into a GLB as an animated texture — drop in a clip and export a 3D-ready asset with the video playing on its surface. Perfect for metaverse builds, screens, VJ loops and animated wearables.",
      points: ["One-click video → animated GLB", "Web / Decentraland ready", "No node-wrangling"],
      href: "https://nikoalerce.gumroad.com/l/Video_to_GLB_Texture_by_Niko_Alerce",
      cta: "Get it on Gumroad ↗",
      price: "Gumroad",
    },
    {
      kicker: "Web app",
      title: "PixAlerce",
      blurb:
        "A free browser tool I built — open it, create, export. Runs entirely in your browser, nothing to install.",
      points: ["Runs in the browser", "Free to use", "Made by an artist, for artists"],
      href: "https://pixalerce.vercel.app/",
      cta: "Open PixAlerce ↗",
      price: "Free",
    },
  ],
  es: [
    {
      kicker: "Addon de Blender",
      title: "Video to GLB Texture",
      blurb:
        "Un addon de Blender que hornea un video directo en un GLB como textura animada — tirá un clip y exportá un asset listo para 3D con el video reproduciéndose en su superficie. Perfecto para builds de metaverso, pantallas, loops de VJ y wearables animados.",
      points: ["Un clic: video → GLB animado", "Listo para web / Decentraland", "Sin tocar nodos"],
      href: "https://nikoalerce.gumroad.com/l/Video_to_GLB_Texture_by_Niko_Alerce",
      cta: "Conseguilo en Gumroad ↗",
      price: "Gumroad",
    },
    {
      kicker: "App web",
      title: "PixAlerce",
      blurb:
        "Una herramienta de navegador gratuita que armé — abrila, creá, exportá. Corre enteramente en tu navegador, nada que instalar.",
      points: ["Corre en el navegador", "Gratis", "Hecho por un artista, para artistas"],
      href: "https://pixalerce.vercel.app/",
      cta: "Abrir PixAlerce ↗",
      price: "Gratis",
    },
  ],
};

const T = {
  en: {
    kicker: "// Tools · things I built",
    titleMain: "Tools I ",
    titleAccent: "made.",
    intro: "Little utilities I built to make my own work faster — now shared so they can speed up yours too. Grab them, use them, make something.",
    supportLabel: "Support",
    supportTitle: "These tools are made by one artist",
    supportBody: "If they helped you — or you just want to support an independent artist rebuilding after a fire — a coffee goes a long way.",
    supportCta: "☕ Support me ↗",
  },
  es: {
    kicker: "// Herramientas · cosas que armé",
    titleMain: "Herramientas que ",
    titleAccent: "hice.",
    intro: "Utilidades que armé para acelerar mi propio laburo — ahora compartidas para que aceleren el tuyo también. Agarralas, usalas, hacé algo.",
    supportLabel: "Apoyo",
    supportTitle: "Estas herramientas las hace un solo artista",
    supportBody: "Si te sirvieron — o simplemente querés apoyar a un artista independiente reconstruyendo después de un incendio — un café ayuda mucho.",
    supportCta: "☕ Apoyame ↗",
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="w-8 h-px rule-accent" />
      <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">{children}</span>
    </div>
  );
}

export default function Tools() {
  const { lang } = useLang();
  const t = T[lang];
  const tools = TOOLS[lang];

  return (
    <section
      id="tools"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1500px] mx-auto border-t border-white/5"
    >
      {/* ── Intro ── */}
      <div className="max-w-3xl">
        <div className="text-[9px] tracking-[0.5em] text-ash uppercase mb-6">
          {t.kicker}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.8rem,9vw,6.5rem)]">
            {t.titleMain} <span className="text-accent">{t.titleAccent}</span>
          </h2>
          <TitleCharacter clip="pointing" size={470} flip className="shrink-0" />
        </div>
        <p className="mt-8 text-lg text-ash leading-relaxed">
          {t.intro}
        </p>
      </div>

      {/* ── Tool cards ── */}
      <div className="grid lg:grid-cols-2 gap-3 md:gap-4 mt-16">
        {tools.map((tItem) => (
          <div
            key={tItem.title}
            className="group flex flex-col border border-white/10 bg-void/40 hover:border-accent/50 transition-colors p-8 md:p-10"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-ash">
                {tItem.kicker}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase border border-white/15 text-bone/80 px-3 py-1.5">
                {tItem.price}
              </span>
            </div>

            <h3 className="font-display text-bone text-3xl md:text-4xl leading-[0.95] mb-4 group-hover:text-accent transition-colors">
              {tItem.title}
            </h3>
            <p className="text-[15px] text-ash leading-relaxed mb-6 max-w-lg">{tItem.blurb}</p>

            <ul className="space-y-2 mb-8">
              {tItem.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[13px] text-bone/85">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {p}
                </li>
              ))}
            </ul>

            <a
              href={tItem.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-6 py-3.5 text-[11px] tracking-[0.25em] uppercase self-start"
            >
              {tItem.cta}
            </a>
          </div>
        ))}
      </div>

      {/* ── Soft support nudge ── */}
      <div className="mt-16">
        <SectionLabel>{t.supportLabel}</SectionLabel>
        <div className="border border-white/10 bg-ink p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-bone text-2xl md:text-3xl leading-tight">
              {t.supportTitle}
            </h3>
            <p className="text-sm text-ash mt-3 max-w-lg">
              {t.supportBody}
            </p>
          </div>
          <a
            href="/support"
            className="shrink-0 inline-flex items-center gap-3 border border-bone/30 text-bone hover:bg-accent hover:border-accent hover:text-void transition-colors px-6 py-4 text-[11px] tracking-[0.25em] uppercase"
          >
            {t.supportCta}
          </a>
        </div>
      </div>
    </section>
  );
}
