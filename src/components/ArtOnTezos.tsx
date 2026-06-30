"use client";

import { useState } from "react";
import clsx from "clsx";
import NFTGallery from "./NFTGallery";

// "Art on Tezos" groups the two Objkt collections as sub-categories: Works (the main
// gallery) and Sidequest (the experimental alter ego). One page, instant tab switch —
// NFTGallery re-fetches when the alias changes.
const COLLECTIONS = [
  {
    key: "works",
    label: "Works",
    alias: "nikoalerce",
    subtitle:
      "The main gallery — 3D animation, illustration and pieces open to collect, synced live with Tezos.",
  },
  {
    key: "sidequest",
    label: "Sidequest",
    alias: "sidequest",
    subtitle:
      "The experimental alter ego — iterations, drafts and happy accidents that don't fit the main canon.",
  },
] as const;

type Key = (typeof COLLECTIONS)[number]["key"];

export default function ArtOnTezos({ initialTab }: { initialTab?: string }) {
  const [active, setActive] = useState<Key>(
    initialTab === "sidequest" ? "sidequest" : "works",
  );
  const col = COLLECTIONS.find((c) => c.key === active) ?? COLLECTIONS[0];

  const tabs = (
    <div className="inline-flex items-center border border-white/12 w-fit">
      {COLLECTIONS.map((c) => (
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
      title="Art on Tezos"
      kicker="Live on Tezos"
      subtitle={col.subtitle}
      tabsSlot={tabs}
    />
  );
}
