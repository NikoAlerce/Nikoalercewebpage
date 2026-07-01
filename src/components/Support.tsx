"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Donation methods. A button only renders if its value is set — so nothing broken
// ever ships. Fill `eth` and `coffee` (a Ko-fi / Buy Me a Coffee / PayPal link) to
// light those up. Tezos is already live.
// ─────────────────────────────────────────────────────────────────────────────
const DONATE = {
  // Fiat "buy me a coffee" — a full URL (e.g. https://ko-fi.com/nikoalerce).
  coffee: "",
  // Crypto receiving addresses.
  tezos: "tz1WNzaqX3KWbBbGtDJRR4Z7ZcVQRpKqcizb",
  eth: "",
};

function CopyRow({ label, symbol, address }: { label: string; symbol: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the address is visible to copy by hand */
    }
  };
  return (
    <div className="border border-white/10 bg-void/40 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="font-sans text-[11px] tracking-[0.3em] uppercase text-ash">{label}</span>
        <span className="font-mono text-[11px] text-accent">{symbol}</span>
      </div>
      <div className="font-mono text-[12px] text-bone/80 break-all leading-relaxed mb-4">{address}</div>
      <button
        onClick={copy}
        className="w-full border border-white/15 text-bone hover:border-accent hover:text-accent transition-colors px-4 py-2.5 text-[11px] tracking-[0.25em] uppercase"
      >
        {copied ? "Copied ✓" : "Copy address"}
      </button>
    </div>
  );
}

export default function Support({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="support"
      className={
        compact
          ? ""
          : "relative py-24 md:py-32 px-6 md:px-10 max-w-[1100px] mx-auto border-t border-white/5"
      }
    >
      {/* Kicker */}
      <div className="flex items-center gap-4 mb-6">
        <span className="w-10 h-px rule-accent" />
        <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
          Support the work
        </span>
      </div>

      <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.4rem,7vw,5rem)]">
        Buy me a coffee<span className="text-accent">.</span>
      </h2>

      {/* Honest, dignified note — edit freely. */}
      <p className="mt-6 font-sans text-[15px] md:text-base text-ash leading-relaxed max-w-2xl">
        I&apos;m an independent artist from El Bolsón, Patagonia, making all of this
        on my own. A forest fire reached my home and I lost the house and nearly
        everything in it — I&apos;m slowly rebuilding while I keep creating.
        If my work means something to you, anything you can spare genuinely helps —
        a coffee, a few coins, whatever feels right. Thank you for being here.
      </p>

      {/* Fiat — buy me a coffee (only if a link is set) */}
      {DONATE.coffee && (
        <a
          href={DONATE.coffee}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-7 py-4 text-[11px] tracking-[0.25em] uppercase"
        >
          ☕ Buy me a coffee ↗
        </a>
      )}

      {/* Crypto */}
      <div className="mt-10">
        <div className="font-sans text-[10px] tracking-[0.35em] uppercase text-ash/70 mb-4">
          …or send crypto — any amount
        </div>
        <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
          {DONATE.tezos && <CopyRow label="Tezos" symbol="XTZ" address={DONATE.tezos} />}
          {DONATE.eth && <CopyRow label="Ethereum" symbol="ETH" address={DONATE.eth} />}
        </div>
      </div>

      <p className="mt-8 font-sans text-[12px] text-ash/70 leading-relaxed max-w-xl">
        You can also collect a piece on{" "}
        <a
          href="https://objkt.com/@nikoalerce"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bone hover:text-accent transition-colors link-underline"
        >
          objkt
        </a>{" "}
        — you get real art and it supports me directly.
      </p>
    </section>
  );
}
