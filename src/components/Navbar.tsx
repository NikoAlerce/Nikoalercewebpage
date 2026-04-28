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
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "backdrop-blur-md bg-void/70 border-b border-white/5"
          : "bg-transparent",
      )}
    >
      <nav className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2 h-2 bg-glitch-red animate-pulse" />
          <GlitchText className="font-bold text-bone group-hover:text-glitch-red transition-colors">
            NIKO_ALERCE
          </GlitchText>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={clsx(
                  "glitch-hover transition-colors",
                  isActive(l.href)
                    ? "text-glitch-red"
                    : "text-ash hover:text-bone",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3 text-[10px] text-ash">
          <span className="w-1.5 h-1.5 bg-glitch-lime rounded-full animate-pulse" />
          <span>LIVE :: TEZOS</span>
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
