"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import NFTCard from "./NFTCard";
import GlitchText from "./GlitchText";
import { isDisplayableToken, tokenStatus } from "@/lib/objkt";
import type { ObjktHolder, ObjktToken } from "@/lib/types";

type Filter = "all" | "for_sale" | "sold_out" | "in_collection";

type Props = {
  alias: string;
  title: string;
  subtitle?: string;
  accent?: "gold" | "jade";
  id?: string;
};

type ApiResp = {
  alias: string;
  address: string | null;
  holder: ObjktHolder | null;
  tokens: ObjktToken[];
};

/** Fisher-Yates shuffle, returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function NFTGallery({
  alias,
  title,
  subtitle,
  accent = "gold",
  id,
}: Props) {
  const [tokens, setTokens] = useState<ObjktToken[]>([]);
  const [holder, setHolder] = useState<ObjktHolder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [shouldLoad, setShouldLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Lazy-load: only fetch when the section is near the viewport.
  // Keeps the landing light until the user decides to view Works/SideQuest.
  useEffect(() => {
    if (shouldLoad) return;
    const node = sentinelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "300px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [shouldLoad]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/objkt?alias=${encodeURIComponent(alias)}&limit=300`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResp = await res.json();
      // Exclude tokens named "G0dz #..." and randomize the order.
      const filtered = (data.tokens ?? []).filter(
        (t) => isDisplayableToken(t) && !t.name?.match(/^G0dz\s*#/i),
      );
      setTokens(shuffle(filtered));
      setHolder(data.holder ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [alias]);

  useEffect(() => {
    if (shouldLoad) load();
  }, [load, shouldLoad]);

  const counts = useMemo(() => {
    let forSale = 0;
    let soldOut = 0;
    let inCollection = 0;
    for (const t of tokens) {
      const s = tokenStatus(t);
      if (s === "for_sale") forSale++;
      else if (s === "sold_out") soldOut++;
      else inCollection++;
    }
    return {
      all: tokens.length,
      for_sale: forSale,
      sold_out: soldOut,
      in_collection: inCollection,
    };
  }, [tokens]);

  const displayed = useMemo(() => {
    if (filter === "all") return tokens;
    return tokens.filter((t) => tokenStatus(t) === filter);
  }, [tokens, filter]);

  const accentClass = accent === "gold" ? "text-glitch-gold" : "text-glitch-jade";
  const accentBorder =
    accent === "gold" ? "border-glitch-gold/30" : "border-glitch-jade/30";
  const activeTabClass =
    accent === "gold"
      ? "border-glitch-gold text-glitch-gold"
      : "border-glitch-jade text-glitch-jade";

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "ALL" },
    { key: "for_sale", label: "FOR SALE" },
    { key: "sold_out", label: "SOLD OUT" },
    { key: "in_collection", label: "ARCHIVE" },
  ];

  return (
    <section
      id={id}
      ref={sentinelRef}
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div className="relative">
          <div className="absolute -top-16 -left-8 text-[12rem] font-black text-white/[0.03] select-none pointer-events-none leading-none z-0">
            {title.toUpperCase()}
          </div>
          <div className={clsx("text-[11px] tracking-[0.8em] mb-4 font-black relative z-10", accentClass)}>
            // OBJKT_DATA_STREAM::{alias.toUpperCase()}
          </div>
          <h2 className="font-display font-black text-bone uppercase leading-[0.8] text-[clamp(3.5rem,12vw,10rem)] relative z-10">
            <GlitchText>{title}</GlitchText>
          </h2>
          {subtitle && (
            <p className="mt-6 max-w-xl text-base text-ash/80 relative z-10 leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div
          className={clsx(
            "text-[10px] tracking-[0.3em] text-ash space-y-1 border-l pl-4",
            accentBorder,
          )}
        >
          <div className="flex justify-between gap-6">
            <span>WALLET</span>
            <span className="text-bone font-mono">
              {holder?.address
                ? `${holder.address.slice(0, 6)}…${holder.address.slice(-4)}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span>TOKENS</span>
            <span className="text-bone">{loading ? "…" : tokens.length}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>STATUS</span>
            <span
              className={
                !shouldLoad
                  ? "text-ash/60"
                  : loading
                  ? "text-ash animate-pulse"
                  : error
                  ? "text-glitch-gold"
                  : "text-glitch-bio"
              }
            >
              {!shouldLoad
                ? "STANDBY"
                : loading
                ? "FETCHING"
                : error
                ? "ERROR"
                : "SYNCED"}
            </span>
          </div>
          <a
            href={`https://objkt.com/@${alias}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-bone hover:text-glitch-gold glitch-hover"
          >
            VIEW ON OBJKT ↗
          </a>
        </div>
      </div>

      {/* Filter tabs */}
      {!loading && !error && tokens.length > 0 && (
        <div className="flex items-center gap-0 mb-8 border border-white/10 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={clsx(
                "px-4 py-2 text-[10px] tracking-[0.3em] uppercase border-r border-white/10 last:border-r-0 transition-colors",
                filter === tab.key
                  ? clsx("bg-white/5", activeTabClass, "border-b-2")
                  : "text-ash hover:text-bone",
              )}
            >
              {tab.label}
              <span className="ml-2 opacity-50">
                ({counts[tab.key]})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Standby (before scrolling) */}
      {!shouldLoad && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-ink/40 border border-white/5"
            />
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {shouldLoad && loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-ink animate-pulse border border-white/5"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="border border-glitch-gold/40 bg-glitch-gold/5 p-6 text-sm text-bone">
          <div className="text-glitch-gold text-xs tracking-[0.3em] mb-2">
            // CONNECTION_FAILED
          </div>
          <div className="text-ash">{error}</div>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 border border-white/20 text-xs tracking-[0.3em] hover:border-glitch-gold hover:text-glitch-gold"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayed.length === 0 && (
        <div className="border border-white/10 p-10 text-center text-ash">
          <div className="text-xs tracking-[0.3em] mb-2">// VOID</div>
          <div>
            {filter === "for_sale"
              ? "No pieces have an active listing right now."
              : filter === "sold_out"
              ? "No pieces are fully sold out yet."
              : filter === "in_collection"
              ? "No archived pieces were found for this filter."
              : `No pieces were found for @${alias}.`}
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && displayed.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {displayed.map((t, i) => (
            <NFTCard
              key={`${t.fa_contract}-${t.token_id}`}
              token={t}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}
