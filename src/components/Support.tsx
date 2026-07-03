"use client";

import { useState } from "react";
import { useLang, type Lang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Emergency support campaign — bilingual (EN/ES). Updated after the second fire
// (July 2026): the first home was lost to the January Epuyén wildfires; the
// rebuilt home was then lost to a heater malfunction, along with the couple's
// pets. Language follows the site-wide switch; /ayuda forces Spanish.
// A method's button only renders if its value is set, so nothing broken ships.
// ─────────────────────────────────────────────────────────────────────────────
const DONATE = {
  coffee: "https://ko-fi.com/nikoalerce",
  paypal: "alercebolson@gmail.com",
  tezos: "tz1WNzaqX3KWbBbGtDJRR4Z7ZcVQRpKqcizb",
  eth: "0x70400e1B9Cf40151E5c76dF8B7C95c87001f51FB",
  btc: "bc1qxzvmjzszjk89uvtazclntp8ch959gu4axv5n8c",
  aliasMaru: { alias: "nectar.producciones", holder: "Mariela Fernanda Gonzalez" },
  aliasNiko: { alias: "giraleaniko", holder: "Nicolas Marcelo Krasniansky" },
};

const T = {
  en: {
    kicker: "Emergency · we need your help",
    titleA: "Help us start again",
    story: [
      "We lost our home for the second time this year. This time, it was due to a malfunction in the heater's metal connection. The pain is immense, because we didn't just lose the house — we lost our pets, who were like our children, and they couldn't make it out. We lost the little we had managed to save from the previous fire, along with all the donations we had received. We are left with only the clothes on our backs. Nothing else. Without our pets.",
      "Thankfully, Maru and I are physically okay. But psychologically, we are shattered. A huge piece of our hearts goes with our babies, the sweetest and most beautiful in the world. They were what I loved most in this life. I will miss them so much. I don't know how to move forward from here.",
      "We lost absolutely everything this time — our work tools, everything. We are completely out of money, not even enough for food. We are going to need help once again. I hate asking for it. I still can't believe this is happening, but if you find it in your heart to help us, we would appreciate it forever.",
    ],
    tlJanLabel: "January 2026",
    tlJan: (
      <>
        The wildfires that swept through Epuyén, Patagonia reached{" "}
        <span className="text-bone">Bosque Gracias</span>, where we lived. Our home
        burned down with nearly everything we owned.
      </>
    ),
    tlJulLabel: "July 2026",
    tlJul: (
      <>
        While rebuilding, a heater malfunction set fire to the place we were living
        in. We lost everything we had recovered — and our beloved pets.
      </>
    ),
    capJulPhoto: "July — our home burning",
    capJulVideo: "July — video of the fire",
    capJanFire: "January — the fire reaching home",
    capJanLeft: "January — what was left",
    waysTitle: "Ways to help",
    waysIntro: (
      <>
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
      </>
    ),
    mIntl: "International — card & PayPal",
    kofiBtn: "☕ Ko-fi — buy us a coffee ↗",
    paypalCopy: "PayPal (send to this email)",
    mAr: "From Argentina — bank transfer / Mercado Pago",
    arIntro:
      "If you're in Argentina, the most direct way to help us is a transfer by alias, to either of our two accounts:",
    aliasMaruLabel: `Maru's alias — ${DONATE.aliasMaru.holder}`,
    aliasNikoLabel: `Niko's alias — ${DONATE.aliasNiko.holder}`,
    mCrypto: "Crypto — any amount",
    btcNote:
      "Send over the Bitcoin network ONLY — funds sent on any other network will be lost.",
    copy: "Copy",
    copied: "Copied ✓",
    closing: (
      <>
        Whatever you can give — even just sharing this page — means the world to us
        right now. Thank you, truly. — Niko &amp; Maru
      </>
    ),
  },
  es: {
    kicker: "Emergencia · necesitamos tu ayuda",
    titleA: "Ayudanos a empezar de nuevo",
    story: [
      "Perdimos nuestra casa por segunda vez en el año. Esta vez fue por una falla en la conexión metálica de la estufa. El dolor es inmenso, porque no perdimos solamente la casa: perdimos a nuestras mascotas, que eran como nuestros hijos, y no pudieron salir. Perdimos lo poco que habíamos logrado salvar del incendio anterior, junto con todas las donaciones que habíamos recibido. Nos quedamos solo con lo puesto. Nada más. Y sin nuestras mascotas.",
      "Por suerte, Maru y yo estamos bien físicamente. Pero psicológicamente estamos destrozados. Un pedazo enorme de nuestro corazón se va con nuestros bebés, los más dulces y hermosos del mundo. Eran lo que más amaba en esta vida. Los voy a extrañar muchísimo. No sé cómo seguir adelante desde acá.",
      "Esta vez perdimos absolutamente todo: nuestras herramientas de trabajo, todo. Nos quedamos completamente sin plata, ni siquiera para comida. Vamos a necesitar ayuda una vez más. Odio pedirla. Todavía no puedo creer que esto esté pasando, pero si encontrás en tu corazón la forma de ayudarnos, te lo vamos a agradecer para siempre.",
    ],
    tlJanLabel: "Enero 2026",
    tlJan: (
      <>
        Los incendios forestales que arrasaron Epuyén, Patagonia, llegaron a{" "}
        <span className="text-bone">Bosque Gracias</span>, donde vivíamos. Nuestra
        casa se quemó con casi todo lo que teníamos.
      </>
    ),
    tlJulLabel: "Julio 2026",
    tlJul: (
      <>
        Mientras reconstruíamos, una falla en la estufa incendió el lugar donde
        estábamos viviendo. Perdimos todo lo que habíamos recuperado — y a nuestras
        mascotas queridas.
      </>
    ),
    capJulPhoto: "Julio — nuestra casa en llamas",
    capJulVideo: "Julio — video del incendio",
    capJanFire: "Enero — el fuego llegando a casa",
    capJanLeft: "Enero — lo que quedó",
    waysTitle: "Cómo ayudar",
    waysIntro: (
      <>
        Todo suma — un café, unas monedas, coleccionar una obra en{" "}
        <a
          href="https://objkt.com/@nikoalerce"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bone hover:text-accent transition-colors link-underline"
        >
          objkt
        </a>
        , o simplemente compartir esta página.
      </>
    ),
    mIntl: "Internacional — tarjeta y PayPal",
    kofiBtn: "☕ Ko-fi — invitanos un café ↗",
    paypalCopy: "PayPal (enviá a este email)",
    mAr: "Desde Argentina — transferencia / Mercado Pago",
    arIntro:
      "Si estás en Argentina, la forma más directa de ayudarnos es por alias, a cualquiera de nuestras dos cuentas:",
    aliasMaruLabel: `Alias de Maru — ${DONATE.aliasMaru.holder}`,
    aliasNikoLabel: `Alias de Niko — ${DONATE.aliasNiko.holder}`,
    mCrypto: "Cripto — cualquier monto",
    btcNote:
      "Enviá ÚNICAMENTE por la red Bitcoin — los fondos enviados por cualquier otra red se pierden.",
    copy: "Copiar",
    copied: "Copiado ✓",
    closing: (
      <>
        Lo que puedas dar — incluso solo compartir esta página — significa muchísimo
        para nosotros en este momento. Gracias de corazón. — Niko &amp; Maru
      </>
    ),
  },
};

function CopyRow({
  label,
  symbol,
  address,
  note,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  symbol?: string;
  address: string;
  note?: string;
  copyLabel: string;
  copiedLabel: string;
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
        {copied ? copiedLabel : copyLabel}
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

export default function Support({ forceLang }: { forceLang?: Lang }) {
  const { lang: ctxLang } = useLang();
  const lang = forceLang ?? ctxLang;
  const t = T[lang];

  return (
    <section
      id="support"
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1100px] mx-auto border-t border-white/5"
    >
      {/* Kicker */}
      <div className="flex items-center gap-4 mb-6">
        <span className="w-10 h-px rule-accent" />
        <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-accent">
          {t.kicker}
        </span>
      </div>

      <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.4rem,7vw,5rem)]">
        {t.titleA}<span className="text-accent">.</span>
      </h2>

      {/* ── The story — Niko's own words ── */}
      <div className="mt-6 space-y-4 font-sans text-[15px] md:text-base text-ash leading-relaxed max-w-2xl">
        {t.story.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* ── Timeline: two fires in one year ── */}
      <div className="mt-10 border-l-2 border-accent/50 pl-5 space-y-4 max-w-2xl">
        <div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-ash/70">
            {t.tlJanLabel}
          </div>
          <p className="font-sans text-[13.5px] text-ash leading-relaxed mt-1">{t.tlJan}</p>
        </div>
        <div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-ash/70">
            {t.tlJulLabel}
          </div>
          <p className="font-sans text-[13.5px] text-ash leading-relaxed mt-1">{t.tlJul}</p>
        </div>
      </div>

      {/* ── Photos & video ── */}
      <div className="mt-10 grid grid-cols-2 gap-3 max-w-2xl">
        <figure>
          <img
            src="/fire2-burning.webp"
            alt={t.capJulPhoto}
            loading="lazy"
            className="w-full h-56 md:h-64 object-cover border border-white/10"
          />
          <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
            {t.capJulPhoto}
          </figcaption>
        </figure>
        <figure>
          <video
            src="/fire2-video.mp4"
            controls
            playsInline
            preload="metadata"
            className="w-full h-56 md:h-64 object-cover border border-white/10 bg-black"
          />
          <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
            {t.capJulVideo}
          </figcaption>
        </figure>
        <figure>
          <img
            src="/fire-approaching.webp"
            alt={t.capJanFire}
            loading="lazy"
            className="w-full h-56 md:h-64 object-cover border border-white/10"
          />
          <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
            {t.capJanFire}
          </figcaption>
        </figure>
        <figure>
          <img
            src="/fire-aftermath.webp"
            alt={t.capJanLeft}
            loading="lazy"
            className="w-full h-56 md:h-64 object-cover border border-white/10"
          />
          <figcaption className="mt-2 font-sans text-[9px] tracking-[0.25em] uppercase text-ash/55">
            {t.capJanLeft}
          </figcaption>
        </figure>
      </div>

      {/* ══════════ WAYS TO HELP ══════════ */}
      <div className="mt-14 max-w-2xl">
        <h3 className="font-display text-bone text-2xl md:text-3xl mb-2">{t.waysTitle}</h3>
        <p className="font-sans text-[13px] text-ash leading-relaxed">{t.waysIntro}</p>

        {/* International — card / PayPal */}
        <MethodLabel>{t.mIntl}</MethodLabel>
        <div className="flex flex-wrap gap-3">
          {DONATE.coffee && (
            <a
              href={DONATE.coffee}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-accent bg-accent text-void hover:bg-accent-soft hover:border-accent-soft transition-colors px-7 py-4 text-[11px] tracking-[0.25em] uppercase"
            >
              {t.kofiBtn}
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
            <CopyRow
              label={t.paypalCopy}
              address={DONATE.paypal}
              copyLabel={t.copy}
              copiedLabel={t.copied}
            />
          </div>
        )}

        {/* Argentina — aliases */}
        <MethodLabel>{t.mAr}</MethodLabel>
        <p className="font-sans text-[13px] text-ash leading-relaxed mb-4">{t.arIntro}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <CopyRow
            label={t.aliasMaruLabel}
            address={DONATE.aliasMaru.alias}
            copyLabel={t.copy}
            copiedLabel={t.copied}
          />
          <CopyRow
            label={t.aliasNikoLabel}
            address={DONATE.aliasNiko.alias}
            copyLabel={t.copy}
            copiedLabel={t.copied}
          />
        </div>

        {/* Crypto */}
        <MethodLabel>{t.mCrypto}</MethodLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          {DONATE.tezos && (
            <CopyRow label="Tezos" symbol="XTZ" address={DONATE.tezos} copyLabel={t.copy} copiedLabel={t.copied} />
          )}
          {DONATE.eth && (
            <CopyRow label="Ethereum" symbol="ETH / EVM" address={DONATE.eth} copyLabel={t.copy} copiedLabel={t.copied} />
          )}
          {DONATE.btc && (
            <CopyRow
              label="Bitcoin"
              symbol="BTC"
              address={DONATE.btc}
              note={t.btcNote}
              copyLabel={t.copy}
              copiedLabel={t.copied}
            />
          )}
        </div>

        {/* Close */}
        <p className="mt-12 font-sans text-[14px] text-bone/85 leading-relaxed max-w-xl">
          {t.closing}
        </p>
      </div>
    </section>
  );
}
