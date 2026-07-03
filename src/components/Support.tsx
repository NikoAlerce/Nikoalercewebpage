"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Emergency support campaign. Updated after the second fire (July 2026): the
// first home was lost to the January Epuyén wildfires; the rebuilt home was then
// lost to a heater malfunction, along with the couple's pets.
// A method's button only renders if its value is set, so nothing broken ships.
// ─────────────────────────────────────────────────────────────────────────────
const DONATE = {
  coffee: "https://ko-fi.com/nikoalerce",
  paypal: "alercebolson@gmail.com",
  tezos: "tz1WNzaqX3KWbBbGtDJRR4Z7ZcVQRpKqcizb",
  eth: "0x70400e1B9Cf40151E5c76dF8B7C95c87001f51FB",
  btc: "bc1qxzvmjzszjk89uvtazclntp8ch959gu4axv5n8c",
  // Argentina bank / Mercado Pago aliases.
  aliasMaru: { alias: "nectar.producciones", holder: "Mariela Fernanda Gonzalez" },
  aliasNiko: { alias: "giraleaniko", holder: "Nicolas Marcelo Krasniansky" },
};

function CopyRow({
  label,
  symbol,
  address,
  note,
}: {
  label: string;
  symbol?: string;
  address: string;
  note?: string;
}) {
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
        {symbol && <span className="font-mono text-[11px] text-accent">{symbol}</span>}
      </div>
      <div className="font-mono text-[12px] text-bone/80 break-all leading-relaxed mb-3">{address}</div>
      {note && (
        <p className="font-sans text-[11px] text-accent/90 leading-relaxed mb-3">⚠ {note}</p>
      )}
      <button
        onClick={copy}
        className="w-full border border-white/15 text-bone hover:border-accent hover:text-accent transition-colors px-4 py-2.5 text-[11px] tracking-[0.25em] uppercase"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

function MethodLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans text-[10px] tracking-[0.35em] uppercase text-ash/70 mb-4 mt-10 first:mt-0">
      {children}
    </div>
  );
}

export default function Support() {
  return (
    <section
      id="support"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1100px] mx-auto border-t border-white/5"
    >
      {/* Kicker */}
      <div className="flex items-center gap-4 mb-6">
        <span className="w-10 h-px rule-accent" />
        <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-accent">
          Emergency · we need your help
        </span>
      </div>

      <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.4rem,7vw,5rem)]">
        Help us start again<span className="text-accent">.</span>
      </h2>

      {/* ── The story — Niko's own words ── */}
      <div className="mt-6 space-y-4 font-sans text-[15px] md:text-base text-ash leading-relaxed max-w-2xl">
        <p>
          We lost our home for the second time this year. This time, it was due to a
          malfunction in the heater&apos;s metal connection. The pain is immense,
          because we didn&apos;t just lose the house — we lost our pets, who were like
          our children, and they couldn&apos;t make it out. We lost the little we had
          managed to save from the previous fire, along with all the donations we had
          received. We are left with only the clothes on our backs. Nothing else.
          Without our pets.
        </p>
        <p>
          Thankfully, Maru and I are physically okay. But psychologically, we are
          shattered. A huge piece of our hearts goes with our babies, the sweetest
          and most beautiful in the world. They were what I loved most in this life.
          I will miss them so much. I don&apos;t know how to move forward from here.
        </p>
        <p>
          We lost absolutely everything this time — our work tools, everything. We
          are completely out of money, not even enough for food. We are going to need
          help once again. I hate asking for it. I still can&apos;t believe this is
          happening, but if you find it in your heart to help us, we would appreciate
          it forever.
        </p>
      </div>

      {/* ── Timeline: two fires in one year ── */}
      <div className="mt-10 border-l-2 border-accent/50 pl-5 space-y-4 max-w-2xl">
        <div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-ash/70">
            January 2026
          </div>
          <p className="font-sans text-[13.5px] text-ash leading-relaxed mt-1">
            The wildfires that swept through Epuyén, Patagonia reached{" "}
            <span className="text-bone">Bosque Gracias</span>, where we lived. Our
            home burned down with nearly everything we owned.
          </p>
        </div>
        <div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-ash/70">
            July 2026
          </div>
          <p className="font-sans text-[13.5px] text-ash leading-relaxed mt-1">
            While rebuilding, a heater malfunction set fire to the place we were
            living in. We lost everything we had recovered — and our beloved pets.
          </p>
        </div>
      </div>

      {/* ── Photos ── */}
      <div className="mt-10 grid grid-cols-2 gap-3 max-w-2xl">
        <figure>
          <img
            src="/fire-approaching.webp"
            alt="The January wildfire reaching our home in Bosque Gracias, near Epuyén"
            loading="lazy"
            className="w-full h-56 md:h-64 object-cover border border-white/10"
          />
          <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
            January — the fire reaching home
          </figcaption>
        </figure>
        <figure>
          <img
            src="/fire-aftermath.webp"
            alt="What remained of our home after the January fire"
            loading="lazy"
            className="w-full h-56 md:h-64 object-cover border border-white/10"
          />
          <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
            January — what was left
          </figcaption>
        </figure>
      </div>

      {/* ══════════ WAYS TO HELP ══════════ */}
      <div className="mt-14 max-w-2xl">
        <h3 className="font-display text-bone text-2xl md:text-3xl mb-2">Ways to help</h3>
        <p className="font-sans text-[13px] text-ash leading-relaxed">
          Anything helps — a coffee, a few coins, collecting a piece on{" "}
          <a
            href="https://objkt.com/@nikoalerce"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone hover:text-accent transition-colors link-underline"
          >
            objkt
          </a>
          , or simply sharing this page.
        </p>

        {/* International — card / PayPal */}
        <MethodLabel>International — card &amp; PayPal</MethodLabel>
        <div className="flex flex-wrap gap-3">
          {DONATE.coffee && (
            <a
              href={DONATE.coffee}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-7 py-4 text-[11px] tracking-[0.25em] uppercase"
            >
              ☕ Ko-fi — buy us a coffee ↗
            </a>
          )}
          {DONATE.paypal && (
            <a
              href={`https://www.paypal.com/donate/?business=${encodeURIComponent(DONATE.paypal)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-white/20 text-bone hover:border-accent hover:text-accent transition-colors px-7 py-4 text-[11px] tracking-[0.25em] uppercase"
            >
              PayPal ↗
            </a>
          )}
        </div>
        {DONATE.paypal && (
          <div className="mt-3 max-w-md">
            <CopyRow label="PayPal (send to this email)" address={DONATE.paypal} />
          </div>
        )}

        {/* Argentina — aliases (in Spanish, for local helpers) */}
        <MethodLabel>Desde Argentina — transferencia / Mercado Pago</MethodLabel>
        <p className="font-sans text-[13px] text-ash leading-relaxed mb-4">
          Si estás en Argentina, la forma más directa de ayudarnos es por alias, a
          cualquiera de nuestras dos cuentas:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <CopyRow
            label={`Alias de Maru — ${DONATE.aliasMaru.holder}`}
            address={DONATE.aliasMaru.alias}
          />
          <CopyRow
            label={`Alias de Niko — ${DONATE.aliasNiko.holder}`}
            address={DONATE.aliasNiko.alias}
          />
        </div>

        {/* Crypto */}
        <MethodLabel>Crypto — any amount</MethodLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          {DONATE.tezos && <CopyRow label="Tezos" symbol="XTZ" address={DONATE.tezos} />}
          {DONATE.eth && <CopyRow label="Ethereum" symbol="ETH / EVM" address={DONATE.eth} />}
          {DONATE.btc && (
            <CopyRow
              label="Bitcoin"
              symbol="BTC"
              address={DONATE.btc}
              note="Send over the Bitcoin network ONLY — funds sent on any other network will be lost."
            />
          )}
        </div>

        {/* Close */}
        <p className="mt-12 font-sans text-[14px] text-bone/85 leading-relaxed max-w-xl">
          Whatever you can give — even just sharing this page — means the world to
          us right now. Thank you, truly. — Niko &amp; Maru
        </p>
      </div>
    </section>
  );
}
