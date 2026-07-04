"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import clsx from "clsx";
import TitleCharacter from "@/components/TitleCharacter";
import NFTCard from "./NFTCard";
import { isDisplayableToken, tokenStatus, detectKind } from "@/lib/objkt";
import type { ObjktHolder, ObjktToken } from "@/lib/types";
import { useLang } from "@/lib/i18n";

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
  kicker?: string;
  /** Optional sub-category tabs rendered under the title (e.g. Works / Sidequest). */
  tabsSlot?: React.ReactNode;
  /** Kept for call-site compatibility; styling is unified on the brand red. */
  accent?: "red" | "cyan";
  id?: string;
};

type ApiResp = {
  alias: string;
  address: string | null;
  holder: ObjktHolder | null;
  tokens: ObjktToken[];
};

const TG = {
  en: {
    wallet: "Wallet",
    pieces: "Pieces",
    status: "Status",
    fetching: "Fetching",
    error: "Error",
    synced: "Synced",
    viewOnObjkt: "View on Objkt",
    statusLabel: "Status",
    typeLabel: "Type",
    filterAll: "All",
    filterForSale: "For sale",
    filterSoldOut: "Sold out",
    filterArchive: "Archive",
    mediaAll: "All types",
    mediaImage: "Image",
    mediaGif: "GIF",
    mediaVideo: "Video",
    media3d: "3D",
    mediaInteractive: "Interactive",
    errorTitle: "Couldn\u2019t reach Objkt",
    retry: "Retry",
    emptyTitle: "Nothing here yet",
    emptyType: "No pieces match the current type + status filter.",
    emptyForSale: "No pieces have an active listing right now.",
    emptySoldOut: "No pieces are fully sold out yet.",
    emptyArchive: "No archived pieces were found for this filter.",
    emptyDefault: "No pieces were found for",
  },
  es: {
    wallet: "Wallet",
    pieces: "Piezas",
    status: "Estado",
    fetching: "Cargando",
    error: "Error",
    synced: "Sincronizado",
    viewOnObjkt: "Ver en Objkt",
    statusLabel: "Estado",
    typeLabel: "Tipo",
    filterAll: "Todas",
    filterForSale: "En venta",
    filterSoldOut: "Agotadas",
    filterArchive: "Archivo",
    mediaAll: "Todos los tipos",
    mediaImage: "Imagen",
    mediaGif: "GIF",
    mediaVideo: "Video",
    media3d: "3D",
    mediaInteractive: "Interactivo",
    errorTitle: "No se pudo conectar con Objkt",
    retry: "Reintentar",
    emptyTitle: "Nada por acá todavía",
    emptyType: "Ninguna pieza coincide con el filtro de tipo + estado actual.",
    emptyForSale: "No hay piezas con listing activo en este momento.",
    emptySoldOut: "Ninguna pieza está completamente agotada todavía.",
    emptyArchive: "No se encontraron piezas archivadas para este filtro.",
    emptyDefault: "No se encontraron piezas para",
  },
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
  kicker = "Live on Tezos",
  tabsSlot,
  id,
}: Props) {
  const { lang } = useLang();
  const t = TG[lang];

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

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "for_sale", label: t.filterForSale },
    { key: "sold_out", label: t.filterSoldOut },
    { key: "in_collection", label: t.filterArchive },
  ];

  // Only show media-type tabs the artist actually has.
  const mediaTabs: { key: MediaFilter; label: string }[] = (
    [
      { key: "all", label: t.mediaAll },
      { key: "image", label: t.mediaImage },
      { key: "gif", label: t.mediaGif },
      { key: "video", label: t.mediaVideo },
      { key: "model", label: t.media3d },
      { key: "interactive", label: t.mediaInteractive },
    ] as { key: MediaFilter; label: string }[]
  ).filter((tab) => tab.key === "all" || mediaCounts[tab.key] > 0);

  const tabClass = (active: boolean) =>
    clsx(
      "px-4 py-2 text-[11px] tracking-[0.18em] border-r border-white/10 last:border-r-0 transition-colors",
      active
        ? "bg-white/[0.04] text-bone border-b-2 border-b-accent"
        : "text-ash hover:text-bone",
    );

  return (
    <section
      id={id}
      className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-px rule-accent" />
            <span className="font-sans text-[11px] tracking-[0.4em] uppercase text-ash">
              {kicker}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="font-graffiti text-bone leading-[1] text-[clamp(2.8rem,10vw,7rem)]">
              {title}
            </h2>
            <TitleCharacter clip="pointing" size={470} flip className="shrink-0" />
          </div>
          {tabsSlot && <div className="mt-6">{tabsSlot}</div>}
          {subtitle && (
            <p className="mt-5 max-w-xl text-[15px] md:text-base text-ash leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Spec sheet */}
        <dl className="text-[12px] font-sans shrink-0 md:min-w-[15rem]">
          <div className="flex justify-between gap-6 py-2 border-b border-white/8">
            <dt className="text-ash tracking-[0.18em] uppercase text-[10px] self-center">
              {t.wallet}
            </dt>
            <dd className="text-bone font-mono">
              {holder?.address
                ? `${holder.address.slice(0, 6)}…${holder.address.slice(-4)}`
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-6 py-2 border-b border-white/8">
            <dt className="text-ash tracking-[0.18em] uppercase text-[10px] self-center">
              {t.pieces}
            </dt>
            <dd className="text-bone">{loading ? "…" : tokens.length}</dd>
          </div>
          <div className="flex justify-between gap-6 py-2 border-b border-white/8">
            <dt className="text-ash tracking-[0.18em] uppercase text-[10px] self-center">
              {t.status}
            </dt>
            <dd className="flex items-center gap-2 text-bone">
              {!loading && !error && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
              <span className={loading ? "text-ash animate-pulse" : error ? "text-accent" : ""}>
                {loading ? t.fetching : error ? t.error : t.synced}
              </span>
            </dd>
          </div>
          <a
            href={`https://objkt.com/@${alias}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 mt-3 text-bone/85 hover:text-accent transition-colors"
          >
            <span className="link-underline">{t.viewOnObjkt}</span>
            <span className="text-ash/50 group-hover:text-accent transition-colors">↗</span>
          </a>
        </dl>
      </div>

      {/* Filters: status + file type */}
      {!loading && !error && tokens.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {/* Status */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-ash/50 w-12 shrink-0">
              {t.statusLabel}
            </span>
            <div className="flex flex-wrap items-center border border-white/10 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={tabClass(filter === tab.key)}
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
              <span className="text-[10px] tracking-[0.3em] uppercase text-ash/50 w-12 shrink-0">
                {t.typeLabel}
              </span>
              <div className="flex flex-wrap items-center border border-white/10 w-fit">
                {mediaTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMedia(tab.key)}
                    className={tabClass(media === tab.key)}
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
        <div className="border border-accent/40 bg-accent/5 p-6 text-sm text-bone">
          <div className="text-accent text-[11px] tracking-[0.25em] uppercase mb-2">
            {t.errorTitle}
          </div>
          <div className="text-ash">{error}</div>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 border border-white/20 text-[11px] tracking-[0.25em] uppercase hover:border-accent hover:text-accent transition-colors"
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayed.length === 0 && (
        <div className="border border-white/10 p-10 text-center text-ash">
          <div className="font-display text-bone text-xl mb-2">{t.emptyTitle}</div>
          <div className="text-sm">
            {media !== "all"
              ? t.emptyType
              : filter === "for_sale"
              ? t.emptyForSale
              : filter === "sold_out"
              ? t.emptySoldOut
              : filter === "in_collection"
              ? t.emptyArchive
              : `${t.emptyDefault} @${alias}.`}
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
