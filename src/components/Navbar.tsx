"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useWallet } from "./WalletContext";

const links = [
  { href: "/#top", label: "HOME" },
  { href: "/art-on-tezos", label: "ART ON TEZOS" },
  { href: "/music", label: "MUSIC" },
  { href: "/metaverse", label: "3D GALLERY" },
  { href: "/decentraland", label: "DECENTRALAND" },
  { href: "/ar-labs", label: "AR LABS" },
  { href: "/shop", label: "SHOP" },
  { href: "/#about", label: "BIO" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { address, connecting, connect, disconnect } = useWallet();

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

  // The 3D gallery is a full-screen immersive experience with its own EXIT button — hide the
  // site chrome there (declutters the mobile HUD and removes the page's footer scroll).
  if (pathname === "/metaverse") return null;

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-[60] transition-all duration-500",
        scrolled
          ? "backdrop-blur-xl bg-void/60 border-b border-white/5 py-2"
          : "bg-transparent py-4",
      )}
    >
      <nav className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group py-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent group-hover:bg-bone transition-colors" />
          <span className="font-display font-semibold text-bone text-xl md:text-2xl leading-none tracking-tight">
            Niko Alerce
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-6 lg:gap-9 font-sans text-[11px] lg:text-xs tracking-[0.18em] uppercase">
          {links.map((l) => (
            <li key={l.href} className="relative group">
              <Link
                href={l.href}
                className={clsx(
                  "transition-colors duration-300 py-2 inline-block",
                  isActive(l.href) ? "text-bone" : "text-ash/65 hover:text-bone",
                )}
              >
                {l.label}
              </Link>
              <span className={clsx(
                "absolute -bottom-0.5 left-0 h-px bg-bone/70 transition-all duration-500",
                isActive(l.href) ? "w-full" : "w-0 group-hover:w-full",
              )} />
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center">
          {address ? (
            <button
              onClick={() => disconnect()}
              title="Disconnect wallet"
              className="font-sans text-[11px] tracking-[0.15em] uppercase px-4 py-2 rounded-full border border-white/20 text-bone hover:border-accent hover:text-accent transition-all flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              {address.slice(0, 6)}…{address.slice(-4)}
            </button>
          ) : (
            <button
              onClick={() => connect()}
              disabled={connecting}
              className="font-sans text-[11px] tracking-[0.15em] uppercase px-5 py-2 rounded-full border border-white/20 text-bone hover:border-bone hover:bg-bone hover:text-void transition-all disabled:opacity-50"
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
          )}
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
                    ? "text-accent"
                    : "text-ash hover:text-bone",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}

          {/* Wallet connect/disconnect — the desktop button is hidden on mobile, so surface
              it here or phones can't connect a wallet to buy. */}
          <li className="pt-3 mt-1 border-t border-white/10">
            {address ? (
              <button
                onClick={() => { disconnect(); setOpen(false); }}
                className="w-full px-4 py-3 border border-white/20 text-bone flex items-center justify-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                {address.slice(0, 6)}…{address.slice(-4)} · DISCONNECT
              </button>
            ) : (
              <button
                onClick={() => { connect(); setOpen(false); }}
                disabled={connecting}
                className="w-full px-4 py-3 border border-white/15 text-bone hover:border-accent hover:bg-accent hover:text-void transition-all disabled:opacity-50"
              >
                {connecting ? "CONNECTING…" : "CONNECT_WALLET"}
              </button>
            )}
          </li>
        </ul>
      )}
    </header>
  );
}
