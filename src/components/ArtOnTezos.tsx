"use client";

import { useState } from "react";
import clsx from "clsx";
import NFTGallery from "./NFTGallery";
import { useLang } from "@/lib/i18n";

// "Art on Tezos" groups the two Objkt collections as sub-categories: Works (the main
// gallery) and Sidequest (the experimental alter ego). One page, instant tab switch —
// NFTGallery re-fetches when the alias changes.
const COLLECTIONS = {
  en: [
    {
      key: "works" as const,
      label: "Works",
      alias: "nikoalerce",
      subtitle:
        "The main gallery — 3D animation, illustration and pieces open to collect, synced live with Tezos.",
    },
    {
      key: "sidequest" as const,
      label: "Sidequest",
      alias: "sidequest",
      subtitle:
        "The experimental alter ego — iterations, drafts and happy accidents that don't fit the main canon.",
    },
  ],
  es: [
    {
      key: "works" as const,
      label: "Works",
      alias: "nikoalerce",
      subtitle:
        "La galería principal — animación 3D, ilustración y piezas abiertas para coleccionar, sincronizadas en vivo con Tezos.",
    },
    {
      key: "sidequest" as const,
      label: "Sidequest",
      alias: "sidequest",
      subtitle:
        "El alter ego experimental — iteraciones, borradores y accidentes felices que no entran en el canon principal.",
    },
  ],
};

type Key = "works" | "sidequest";

export default function ArtOnTezos({ initialTab }: { initialTab?: string }) {
  const { lang } = useLang();
  const collections = COLLECTIONS[lang];
  const [active, setActive] = useState<Key>(
    initialTab === "sidequest" ? "sidequest" : "works",
  );
  const col = collections.find((c) => c.key === active) ?? collections[0];

  const tabs = (
    <div className="inline-flex items-center border border-white/12 w-fit">
      {collections.map((c) => (
        <button
          key={c.key}
          onClick={() => setActive(c.key)}
          className={clsx(
            "px-5 py-2.5 text-[12px] tracking-[0.18em] uppercase border-r border-white/12 last:border-r-0 transition-colors",
            active === c.key
              ? "bg-white/[0.04] text-bone border-b-2 border-b-accent"
              : "text-ash hover:text-bone",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );

  return (
    <NFTGallery
      id="art-on-tezos"
      alias={col.alias}
      title={lang === "es" ? "Arte en Tezos" : "Art on Tezos"}
      kicker={lang === "es" ? "En vivo en Tezos" : "Live on Tezos"}
      subtitle={col.subtitle}
      tabsSlot={tabs}
    />
  );
}
