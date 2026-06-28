"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import NFTCard from "./NFTCard";
import GlitchText from "./GlitchText";
import { isDisplayableToken, tokenStatus, detectKind } from "@/lib/objkt";
import type { ObjktHolder, ObjktToken } from "@/lib/types";

type Filter = "all" | "for_sale" | "sold_out" | "in_collection";
type MediaFilter = "all" | "image" | "gif" | "video" | "model" | "interactive";

// Map a token's mime to a media category (gif split out from static images).
function mediaCat(t: ObjktToken): Exclude<MediaFilter, "all"> | "other" {
  const k = detectKind(t.mime);
  if (k === "image") return t.mime === "image/gif" ? "gif" : "image";
  if (k === "video") return "video";
  if (k === "model") return "model";
  if (k === "html") return "interactive";
  return "other"; // audio / unknown
}

type Props = {
  alias: string;
  title: string;
  subtitle?: string;
  accent?: "red" | "cyan";
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
  accent = "red",
  id,
}: Props) {
  const [tokens, setTokens] = useState<ObjktToken[]>([]);
  const [holder, setHolder] = useState<ObjktHolder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [media, setMedia] = useState<MediaFilter>("all");

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
    load();
  }, [load]);

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

  const mediaCounts = useMemo(() => {
    const c = { all: tokens.length, image: 0, gif: 0, video: 0, model: 0, interactive: 0 };
    for (const t of tokens) {
      const m = mediaCat(t);
      if (m !== "other") c[m]++;
    }
    return c;
  }, [tokens]);

  const displayed = useMemo(() => {
    return tokens.filter(
      (t) =>
        (filter === "all" || tokenStatus(t) === filter) &&
        (media === "all" || mediaCat(t) === media),
    );
  }, [tokens, filter, media]);

  const accentClass = accent === "red" ? "text-glitch-red" : "text-glitch-cyan";
  const accentBorder =
    accent === "red" ? "border-glitch-red/30" : "border-glitch-cyan/30";
  const activeTabClass =
    accent === "red"
      ? "border-glitch-red text-glitch-red"
      : "border-glitch-cyan text-glitch-cyan";

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "ALL" },
    { key: "for_sale", label: "FOR SALE" },
    { key: "sold_out", label: "SOLD OUT" },
    { key: "in_collection", label: "ARCHIVE" },
  ];

  // Only show media-type tabs the artist actually has.
  const mediaTabs: { key: MediaFilter; label: string }[] = (
    [
      { key: "all", label: "ALL TYPES" },
      { key: "image", label: "IMAGE" },
      { key: "gif", label: "GIF" },
      { key: "video", label: "VIDEO" },
      { key: "model", label: "3D" },
      { key: "interactive", label: "INTERACTIVE" },
    ] as { key: MediaFilter; label: string }[]
  ).filter((t) => t.key === "all" || mediaCounts[t.key] > 0);

  return (
    <section
      id={id}
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
                loading
                  ? "text-ash animate-pulse"
                  : error
                  ? "text-glitch-red"
                  : "text-glitch-lime"
              }
            >
              {loading
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
            className="block mt-2 text-bone hover:text-glitch-red glitch-hover"
          >
            VIEW ON OBJKT ↗
          </a>
        </div>
      </div>

      {/* Filters: status + file type */}
      {!loading && !error && tokens.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {/* Status */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[9px] tracking-[0.4em] text-ash/50 w-12 shrink-0">STATUS</span>
            <div className="flex flex-wrap items-center border border-white/10 w-fit">
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
                  <span className="ml-2 opacity-50">({counts[tab.key]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* File type */}
          {mediaTabs.length > 2 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[9px] tracking-[0.4em] text-ash/50 w-12 shrink-0">TYPE</span>
              <div className="flex flex-wrap items-center border border-white/10 w-fit">
                {mediaTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMedia(tab.key)}
                    className={clsx(
                      "px-4 py-2 text-[10px] tracking-[0.3em] uppercase border-r border-white/10 last:border-r-0 transition-colors",
                      media === tab.key
                        ? clsx("bg-white/5", activeTabClass, "border-b-2")
                        : "text-ash hover:text-bone",
                    )}
                  >
                    {tab.label}
                    <span className="ml-2 opacity-50">({mediaCounts[tab.key]})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
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
        <div className="border border-glitch-red/40 bg-glitch-red/5 p-6 text-sm text-bone">
          <div className="text-glitch-red text-xs tracking-[0.3em] mb-2">
            // CONNECTION_FAILED
          </div>
          <div className="text-ash">{error}</div>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 border border-white/20 text-xs tracking-[0.3em] hover:border-glitch-red hover:text-glitch-red"
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
            {media !== "all"
              ? "No pieces match the current type + status filter."
              : filter === "for_sale"
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
