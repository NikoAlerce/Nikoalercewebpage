"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import GlitchText from "./GlitchText";

const links = [
  { href: "/works", label: "WORKS" },
  { href: "/sidequest", label: "SIDEQUEST" },
  { href: "/shop", label: "SHOP" },
  { href: "/#about", label: "BIO" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let raf = 0;
    let last = scrolled;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = window.scrollY > 12;
        // Avoid setState (and the ensuing re-render) when the boolean state
        // hasn't actually changed — without this, every wheel tick re-renders.
        if (next !== last) {
          last = next;
          setScrolled(next);
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the mobile menu when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-[60] transition-all duration-500",
        scrolled
          ? "backdrop-blur-xl bg-void/60 border-b border-white/5 py-2"
          : "bg-transparent py-4",
      )}
    >
      <nav className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between text-xs md:text-sm uppercase tracking-[0.4em] font-bold">
        <Link href="/" className="flex items-center gap-4 group relative py-4">
          <div className="relative w-3 h-3 overflow-hidden">
            <span className="absolute inset-0 bg-glitch-red animate-pulse" />
            <span className="absolute inset-0 bg-glitch-cyan translate-x-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="font-display font-black text-bone tracking-tighter text-lg leading-none group-hover:text-glitch-red transition-colors flex flex-col">
            <span>NIKO</span>
            <span className="text-[10px] tracking-[0.5em] -mt-1 opacity-60 group-hover:opacity-100">ALERCE</span>
          </div>
        </Link>

        <ul className="hidden md:flex items-center gap-14">
          {links.map((l) => (
            <li key={l.href} className="relative group">
              <Link
                href={l.href}
                className={clsx(
                  "transition-all duration-300 py-2 inline-block",
                  isActive(l.href)
                    ? "text-bone"
                    : "text-ash/60 hover:text-bone",
                )}
              >
                {l.label}
              </Link>
              <span className={clsx(
                "absolute -bottom-1 left-0 h-0.5 bg-glitch-red transition-all duration-500",
                isActive(l.href) ? "w-full" : "w-0 group-hover:w-full"
              )} />
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-6">
          <div className="flex flex-col items-end gap-0.5 opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[8px] tracking-[0.6em] text-ash">NETWORK_STATUS</span>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-glitch-lime rounded-full shadow-[0_0_8px_#39ff14]" />
              <span className="text-bone">TEZOS_MAINNET</span>
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <Link 
            href="/works"
            className="px-4 py-2 border border-white/15 text-bone hover:border-glitch-red hover:bg-glitch-red transition-all"
          >
            COLLECT_ART
          </Link>
        </div>

        <button
          aria-label="menu"
          className="md:hidden text-bone text-base"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕" : "≡"}
        </button>
      </nav>

      {open && (
        <ul className="md:hidden flex flex-col bg-void/95 border-t border-white/5 px-6 py-4 gap-4 text-xs uppercase tracking-[0.2em]">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "transition-colors",
                  isActive(l.href)
                    ? "text-glitch-red"
                    : "text-ash hover:text-glitch-red",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
