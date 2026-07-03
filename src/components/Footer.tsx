"use client";

import { usePathname } from "next/navigation";
import TitleCharacter from "@/components/TitleCharacter";

const socials = [
  { label: "Objkt — Niko", href: "https://objkt.com/@nikoalerce" },
  { label: "Objkt — Sidequest", href: "https://objkt.com/@sidequest" },
  { label: "Instagram", href: "https://www.instagram.com/nikoalerce.art/" },
  { label: "Twitter / X", href: "https://x.com/NikoAlerce" },
];

export default function Footer() {
  const pathname = usePathname();
  // Hidden on the immersive 3D gallery (see Navbar).
  if (pathname === "/metaverse") return null;
  return (
    <footer
      id="contact"
      className="relative border-t border-white/10 px-6 md:px-10 py-24 md:py-28 max-w-[1500px] mx-auto"
    >
      <div className="grid md:grid-cols-2 gap-16 items-end">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-px rule-accent" />
            <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
              Get in touch
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <h3 className="font-graffiti text-bone leading-[1] text-[clamp(2.6rem,7vw,5rem)]">
              Let&apos;s build
              <br />
              <span className="text-accent">something.</span>
            </h3>
            <TitleCharacter clip="waving" size={470} flip className="shrink-0" />
          </div>
          <p className="mt-6 font-sans text-[15px] text-ash max-w-md leading-relaxed">
            Commissions, collaborations, exhibitions, joint drops. If you can
            imagine it in 3D, we can materialise it.
          </p>
          <a
            href="mailto:alercebolson@gmail.com"
            className="mt-7 inline-flex items-center gap-3 text-bone hover:text-accent transition-colors text-base md:text-lg font-sans group"
          >
            <span className="link-underline">alercebolson@gmail.com</span>
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
          {socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-void hover:bg-ink transition-colors duration-500 p-5"
            >
              <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-ash group-hover:text-accent transition-colors">
                {s.label}
              </div>
              <div className="mt-2 text-bone/90 text-[13px] font-sans break-all group-hover:translate-x-0.5 transition-transform">
                {s.href.replace("https://", "").replace(/\/$/, "")} ↗
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Support an independent artist ── */}
      <a
        href="/support"
        className="group mt-16 block overflow-hidden border border-accent/40 bg-accent/[0.04] hover:bg-accent/[0.08] transition-colors p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-2">
              Emergency · support us
            </div>
            <div className="font-display text-bone text-xl md:text-2xl">
              We lost our home to a fire — any help means the world ☕
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-3 border border-accent bg-accent text-void px-6 py-3.5 text-[11px] tracking-[0.25em] uppercase group-hover:bg-accent-soft group-hover:border-accent-soft transition-colors">
            Support me ↗
          </span>
        </div>
      </a>

      <div className="mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 font-sans text-[10.5px] tracking-[0.25em] uppercase text-ash">
        <div>© {new Date().getFullYear()} Niko Alerce — All rights reserved</div>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-accent rounded-full" />
          <span>Next.js · React Three Fiber · Objkt · Tezos</span>
        </div>
      </div>
    </footer>
  );
}
