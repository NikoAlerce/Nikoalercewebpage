const STATS = [
  { k: "Status", v: "Available", live: true },
  { k: "Fields", v: "3D · Music · Video · XR" },
  { k: "Label", v: "El Bosquecito" },
  { k: "Chains", v: "Tezos · Decentraland" },
  { k: "Base", v: "El Bolsón, Patagonia" },
];

const LINKS = [
  { label: "objkt.com/@nikoalerce", href: "https://objkt.com/@nikoalerce" },
  { label: "objkt.com/@sidequest", href: "https://objkt.com/@sidequest" },
  { label: "x.com/NikoAlerce", href: "https://x.com/NikoAlerce" },
  { label: "instagram/nikoalerce.art", href: "https://www.instagram.com/nikoalerce.art/" },
];

const CRAFT = [
  {
    n: "01",
    title: "3D & Motion",
    body: "Blender modelling, animation and motion graphics. Characters, environments and assets for web, games and VR.",
  },
  {
    n: "02",
    title: "El Bosquecito Records",
    body: "Compose, record, mix and master. Hip-hop, trap, lo-fi and experimental electronic — released on every major platform.",
  },
  {
    n: "03",
    title: "Worlds & Tools",
    body: "Decentraland real estate and wearables, a commercial Blender addon, and full video post-production.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="relative py-28 md:py-40 px-6 md:px-10 max-w-[1500px] mx-auto border-t border-white/5"
    >
      {/* ── Showreel ── */}
      <div className="relative z-10 mb-20 md:mb-28">
        <div className="flex items-center gap-4 mb-6">
          <span className="w-10 h-px rule-accent" />
          <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
            Showreel
          </span>
        </div>
        <div className="relative w-full aspect-video overflow-hidden bg-black border border-white/10 rounded-sm shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/1MQ428VFzIo?autoplay=1&mute=1&loop=1&playlist=1MQ428VFzIo&controls=1&rel=0&modestbranding=1&playsinline=1"
            title="Niko Alerce — showreel"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* LEFT: identity + spec sheet */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-10">
          <div>
            <div className="font-display text-bone leading-[0.9] tracking-[-0.02em] text-5xl">
              Niko
              <br />
              Alerce
            </div>
            <div className="mt-4 font-sans text-[11px] tracking-[0.35em] uppercase text-ash">
              Multidisciplinary artist
            </div>
          </div>

          <dl className="text-[13px] font-sans">
            {STATS.map((s) => (
              <div
                key={s.k}
                className="flex justify-between gap-4 py-3 border-b border-white/8"
              >
                <dt className="text-ash tracking-[0.18em] uppercase text-[10.5px] self-center">
                  {s.k}
                </dt>
                <dd className="text-bone text-right flex items-center gap-2">
                  {s.live && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>

          <div className="space-y-2.5">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-bone/85 hover:text-accent transition-colors text-[13px] font-sans"
              >
                <span className="link-underline">{l.label}</span>
                <span className="text-ash/50 group-hover:text-accent transition-colors">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </aside>

        {/* RIGHT: the story */}
        <div className="lg:col-span-8 space-y-12">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <span className="w-10 h-px rule-accent" />
              <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
                Profile
              </span>
            </div>
            <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.6rem,8vw,6rem)]">
              Full-stack
              <br />
              <span className="text-accent">creative.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 text-[15px] md:text-[16px] text-bone/85 leading-relaxed font-sans">
            <p>
              I&apos;m <span className="text-bone font-semibold">Niko Alerce</span>,
              a multidisciplinary artist based in{" "}
              <span className="text-bone font-semibold">El Bolsón, Patagonia</span>.
              I work at the intersection of visual art, sound design and
              immersive technology — end-to-end production for people who need
              more than a single-discipline contractor.
            </p>
            <p>
              I produce{" "}
              <span className="text-bone font-semibold">
                3D illustration, motion graphics and animation
              </span>{" "}
              in Blender — character design, environment art and animated assets
              optimised for web, game engines and VR. I&apos;ve shipped original
              NFT collections on Objkt, born from artist residencies in
              Patagonia.
            </p>
            <p>
              I founded{" "}
              <span className="text-accent font-semibold">
                El Bosquecito Records
              </span>
              , where I produce, record, mix and master original music —
              hip-hop, trap, lo-fi and experimental electronic — handling the
              whole pipeline from composition to master.
            </p>
            <p>
              I design and build virtual real estate and wearables for{" "}
              <span className="text-bone font-semibold">Decentraland</span>,
              authored a commercial Blender addon that turns video textures into
              optimised GLB animations, and handle video post in After Effects
              and Premiere. One stack, one vision — concept to delivery.
            </p>
          </div>

          {/* Craft cards */}
          <div className="grid sm:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {CRAFT.map((c) => (
              <div
                key={c.n}
                className="group bg-void hover:bg-ink transition-colors duration-500 p-6"
              >
                <div className="font-mono text-[11px] tracking-[0.3em] text-ash/60 group-hover:text-accent transition-colors">
                  {c.n}
                </div>
                <div className="mt-5 font-display text-xl text-bone">
                  {c.title}
                </div>
                <p className="mt-3 text-[13px] text-ash leading-relaxed">
                  {c.body}
                </p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <blockquote className="relative pl-6 border-l-2 border-accent/70 max-w-2xl">
            <p className="font-display text-xl md:text-2xl text-bone/90 leading-snug">
              &ldquo;One studio, one vision. You&apos;re not coordinating four
              contractors — I own the full stack, from concept to delivery.&rdquo;
            </p>
            <footer className="mt-4 font-sans text-[11px] tracking-[0.35em] uppercase text-ash">
              — Niko Alerce
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
