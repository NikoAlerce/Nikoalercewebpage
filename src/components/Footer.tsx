"use client";

import GlitchText from "./GlitchText";

const socials = [
  { label: "OBJKT // NIKO", href: "https://objkt.com/@nikoalerce" },
  { label: "OBJKT // SIDEQUEST", href: "https://objkt.com/@sidequest" },
  { label: "INSTAGRAM", href: "https://www.instagram.com/nikoalerce.art/" },
  { label: "TWITTER / X", href: "https://x.com/NikoAlerce" },
];

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative border-t border-white/10 px-6 md:px-10 py-20 max-w-[1600px] mx-auto"
    >
      <div className="grid md:grid-cols-2 gap-16">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-glitch-cyan mb-4">
            // SIGNAL_OUT
          </div>
          <h3 className="font-display font-bold text-bone uppercase leading-[0.9] text-[clamp(2rem,6vw,5rem)]">
            <GlitchText>LET&apos;S</GlitchText>
            <br />
            <GlitchText>BUILD</GlitchText>
          </h3>
          <p className="mt-6 text-sm text-ash max-w-md">
            Commissions, collaborations, exhibitions, joint drops. If you
            imagined it in 3D, we can materialize it.
          </p>
          <a
            href="mailto:hello@nikoalerce.art"
            className="mt-6 inline-flex items-center gap-3 text-bone hover:text-glitch-red glitch-hover text-base"
          >
            hello@nikoalerce.art →
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-white/10 p-5 hover:border-glitch-red/60 transition-colors"
            >
              <div className="text-[10px] tracking-[0.3em] text-ash group-hover:text-glitch-red transition-colors">
                {s.label}
              </div>
              <div className="mt-2 text-bone text-sm font-mono break-all group-hover:translate-x-1 transition-transform">
                {s.href.replace("https://", "")} ↗
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-20 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 text-[10px] tracking-[0.3em] text-ash">
        <div>© {new Date().getFullYear()} NIKO_ALERCE :: ALL_RIGHTS_RESERVED</div>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-glitch-lime rounded-full animate-pulse" />
          <span>POWERED_BY :: NEXT.JS · R3F · OBJKT_API · TEZOS</span>
        </div>
      </div>
    </footer>
  );
}
