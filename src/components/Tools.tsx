import TitleCharacter from "@/components/TitleCharacter";

// Each tool I make and share. Edit copy freely — `blurb` is the pitch, `points` the
// bullet features, `cta` the button label, `href` the link, `price` optional.
const TOOLS = [
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
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="w-8 h-px rule-accent" />
      <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">{children}</span>
    </div>
  );
}

export default function Tools() {
  return (
    <section
      id="tools"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1500px] mx-auto border-t border-white/5"
    >
      {/* ── Intro ── */}
      <div className="max-w-3xl">
        <div className="text-[9px] tracking-[0.5em] text-ash uppercase mb-6">
          // Tools · things I built
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.8rem,9vw,6.5rem)]">
            Tools I <span className="text-accent">made.</span>
          </h2>
          <TitleCharacter clip="pointing" size={470} flip className="shrink-0" />
        </div>
        <p className="mt-8 text-lg text-ash leading-relaxed">
          Little utilities I built to make my own work faster — now shared so they
          can speed up yours too. Grab them, use them, make something.
        </p>
      </div>

      {/* ── Tool cards ── */}
      <div className="grid lg:grid-cols-2 gap-3 md:gap-4 mt-16">
        {TOOLS.map((t) => (
          <div
            key={t.title}
            className="group flex flex-col border border-white/10 bg-void/40 hover:border-accent/50 transition-colors p-8 md:p-10"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-ash">
                {t.kicker}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase border border-white/15 text-bone/80 px-3 py-1.5">
                {t.price}
              </span>
            </div>

            <h3 className="font-display text-bone text-3xl md:text-4xl leading-[0.95] mb-4 group-hover:text-accent transition-colors">
              {t.title}
            </h3>
            <p className="text-[15px] text-ash leading-relaxed mb-6 max-w-lg">{t.blurb}</p>

            <ul className="space-y-2 mb-8">
              {t.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[13px] text-bone/85">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {p}
                </li>
              ))}
            </ul>

            <a
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-6 py-3.5 text-[11px] tracking-[0.25em] uppercase self-start"
            >
              {t.cta}
            </a>
          </div>
        ))}
      </div>

      {/* ── Soft support nudge ── */}
      <div className="mt-16">
        <SectionLabel>Support</SectionLabel>
        <div className="border border-white/10 bg-ink p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-bone text-2xl md:text-3xl leading-tight">
              These tools are made by one artist
            </h3>
            <p className="text-sm text-ash mt-3 max-w-lg">
              If they helped you — or you just want to support an independent artist
              rebuilding after a fire — a coffee goes a long way.
            </p>
          </div>
          <a
            href="/support"
            className="shrink-0 inline-flex items-center gap-3 border border-bone/30 text-bone hover:bg-accent hover:border-accent hover:text-void transition-colors px-6 py-4 text-[11px] tracking-[0.25em] uppercase"
          >
            ☕ Support me ↗
          </a>
        </div>
      </div>
    </section>
  );
}
