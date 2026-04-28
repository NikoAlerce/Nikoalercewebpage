"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  detectKind,
  ipfsToUrl,
  ipfsWithGateway,
  IPFS_GATEWAYS,
  objktTokenUrl,
  tokenStatus,
  lowestPriceXtz,
  editionsLabel,
  creatorHoldsQuantity,
  activeListingAmountLeft,
  listingPriceMutez,
  listingBigmapKey,
} from "@/lib/objkt";
import { useTokenViewer } from "./TokenViewerContext";
import { useWallet } from "./WalletContext";

const GlbViewer = dynamic(() => import("./GlbViewer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-[10px] text-ash animate-pulse">
      INITIALIZING_RENDERER...
    </div>
  ),
});

type BuyState =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "pending"; opHash: string }
  | { kind: "success"; opHash: string }
  | { kind: "error"; message: string };

export default function TokenViewerModal() {
  const { token, close } = useTokenViewer();
  const { address, connecting, connect, disconnect, resetConnection, buy } =
    useWallet();
  const [imgGw, setImgGw] = useState(0);
  const [buyState, setBuyState] = useState<BuyState>({ kind: "idle" });
  const [showStuckHint, setShowStuckHint] = useState(false);

  // Reset image state when the token changes (avoids stale imgGw)
  useEffect(() => {
    setImgGw(0);
    setBuyState({ kind: "idle" });
    setShowStuckHint(false);
  }, [token?.fa_contract, token?.token_id]);

  // After ~25s of "signing", suggest resetting the wallet pairing — the most
  // common cause of a request that "never arrives" in Kukai/Temple is a stale
  // matrix peer cached in localStorage from a previous session.
  useEffect(() => {
    if (buyState.kind !== "signing") {
      setShowStuckHint(false);
      return;
    }
    const t = setTimeout(() => setShowStuckHint(true), 25_000);
    return () => clearTimeout(t);
  }, [buyState.kind]);

  const handleResetWallet = useCallback(async () => {
    await resetConnection();
    setBuyState({ kind: "idle" });
    setShowStuckHint(false);
  }, [resetConnection]);

  const onImgError = useCallback(() => {
    setImgGw((i) => Math.min(i + 1, IPFS_GATEWAYS.length - 1));
  }, []);

  // All hooks must be declared BEFORE any early return to avoid
  // "Rendered more hooks than during the previous render".
  const listing = token?.listings_active?.[0] ?? null;

  const handleBuy = useCallback(async () => {
    if (!listing) return;
    if (!address) {
      const pkh = await connect();
      if (!pkh) return;
    }
    setBuyState({ kind: "signing" });
    const mutez = listingPriceMutez(listing);
    if (mutez === null) {
      setBuyState({
        kind: "error",
        message: "Could not read listing price. Open this piece on Objkt.",
      });
      return;
    }
    const bigmapKey = listingBigmapKey(listing);
    if (bigmapKey === null) {
      setBuyState({
        kind: "error",
        message: "Invalid listing id. Open this piece on Objkt.",
      });
      return;
    }
    // fulfill_ask %amount / editions is HOW MANY editions to buy, not "max left".
    // We were wrongly passing amount_left (e.g. 50) while only attaching one
    // edition's worth of XTZ → M_TEZ_AMOUNT_MISMATCH on-chain.
    // Single BUY button = purchase 1 edition per click (Objkt UX matches this).
    const editionsToBuy = 1;
    const res = await buy({
      marketplaceContract: listing.marketplace_contract!,
      bigmapKey,
      priceMutez: mutez,
      currencyId: listing.currency_id ?? 1,
      editions: editionsToBuy,
      sellerAddress: listing.seller_address,
    });
    if (res.ok) {
      setBuyState({ kind: "pending", opHash: res.opHash });
      setTimeout(() => {
        setBuyState({ kind: "success", opHash: res.opHash });
      }, 30_000);
    } else {
      setBuyState({ kind: "error", message: res.error });
    }
  }, [address, buy, connect, listing]);

  if (!token) return null;

  const kind = detectKind(token.mime);
  const status = tokenStatus(token);
  const price = lowestPriceXtz(token);
  const editions = editionsLabel(token);
  const heldByCreator = creatorHoldsQuantity(token);
  const amountLeft = activeListingAmountLeft(token);

  // The viewer uses artifact_uri (the real file) instead of the thumbnail.
  const artifact = ipfsToUrl(token.artifact_uri);
  const fallbackImage = ipfsWithGateway(
    token.artifact_uri ?? token.display_uri ?? token.thumbnail_uri,
    imgGw,
  );

  const buyUrl = objktTokenUrl(token);
  const creatorName =
    token.creators?.[0]?.holder?.alias ??
    token.creators?.[0]?.holder?.address ??
    "—";

  const canBuyOnSite =
    status === "for_sale" &&
    !!listing?.marketplace_contract &&
    listingBigmapKey(listing) !== null &&
    listingPriceMutez(listing) !== null &&
    listing.currency_id === 1;

  // Objkt's marketplace contract throws M_NO_SELF_FULFILL if the buyer is the
  // seller — disable the button preemptively when the connected wallet is the
  // listing's seller_address (case-insensitive: tz1 addresses are case-sensitive,
  // but normalize anyway in case the indexer ever returns mixed case).
  const isOwnListing =
    !!address &&
    !!listing?.seller_address &&
    address.toLowerCase() === listing.seller_address.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-void/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      {/* TOP BAR */}
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/10 bg-void/80">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] text-ash min-w-0">
          <span className="w-1.5 h-1.5 bg-glitch-red animate-pulse shrink-0" />
          <span className="truncate">
            {(token.name ?? "untitled").toUpperCase()}
          </span>
          <span className="hidden md:inline opacity-50">·</span>
          <span className="hidden md:inline opacity-50">
            {token.fa_contract.slice(0, 8)}…/{token.token_id}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Wallet badge */}
          {address ? (
            <button
              onClick={disconnect}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.3em] border border-glitch-lime/30 text-glitch-lime hover:bg-glitch-lime/10"
              title="Disconnect wallet"
            >
              <span className="w-1.5 h-1.5 bg-glitch-lime rounded-full" />
              {address.slice(0, 6)}…{address.slice(-4)}
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="hidden md:block px-3 py-1.5 text-[10px] tracking-[0.3em] border border-white/15 text-ash hover:border-bone hover:text-bone disabled:opacity-50"
            >
              {connecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          )}
          <button
            onClick={close}
            aria-label="Close"
            className="text-bone hover:text-glitch-red text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 grid lg:grid-cols-[1fr_400px] overflow-hidden">
        {/* VIEWER */}
        <div className="relative bg-black overflow-hidden min-h-[50vh] lg:min-h-0">
          {kind === "model" && artifact ? (
            <GlbViewer url={artifact} />
          ) : kind === "video" && artifact ? (
            <video
              src={artifact}
              autoPlay
              loop
              controls
              playsInline
              poster={fallbackImage ?? undefined}
              className="w-full h-full object-contain bg-black"
            />
          ) : kind === "audio" && artifact ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-full max-w-md flex flex-col items-center gap-4 px-6">
                {fallbackImage && (
                  <img
                    src={fallbackImage}
                    alt={token.name ?? "untitled"}
                    onError={onImgError}
                    className="w-full max-w-xs aspect-square object-cover border border-white/10"
                  />
                )}
                <audio src={artifact} controls className="w-full" />
              </div>
            </div>
          ) : kind === "html" && artifact ? (
            <iframe
              src={artifact}
              title={token.name ?? "interactive"}
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
              className="w-full h-full bg-black"
              allow="autoplay; fullscreen; xr-spatial-tracking"
            />
          ) : fallbackImage ? (
            <img
              key={fallbackImage}
              src={fallbackImage}
              alt={token.name ?? "untitled"}
              onError={onImgError}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[10px] text-ash">
              NO_MEDIA
            </div>
          )}
        </div>

        {/* PANEL */}
        <aside className="border-l border-white/10 overflow-y-auto bg-void">
          <div className="p-6 space-y-6">
            <div>
              <div
                className={
                  "text-[10px] tracking-[0.4em] mb-2 " +
                  (status === "for_sale"
                    ? "text-glitch-lime"
                    : status === "sold_out"
                    ? "text-glitch-red"
                    : "text-ash")
                }
              >
                //{" "}
                {status === "for_sale"
                  ? "AVAILABLE"
                  : status === "sold_out"
                  ? "SOLD OUT"
                  : "ARCHIVE"}
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-bone leading-tight">
                {token.name ?? "untitled"}
              </h3>
              <p className="mt-2 text-[11px] tracking-[0.2em] text-ash">
                BY {creatorName.toUpperCase()}
              </p>
            </div>

            {/* PURCHASE */}
            {status === "for_sale" && price !== null && (
              <div className="border border-glitch-lime/40 bg-glitch-lime/5 p-5">
                <div className="text-[10px] tracking-[0.4em] text-glitch-lime mb-1">
                  // PRICE
                </div>
                <div className="font-mono text-3xl text-bone">
                  {price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} XTZ
                </div>
                {amountLeft > 0 && (
                  <div className="mt-1 text-[11px] tracking-[0.2em] text-ash">
                    {amountLeft} EDITION{amountLeft !== 1 ? "S" : ""} AVAILABLE
                  </div>
                )}

                {/* Purchase state */}
                {buyState.kind === "success" ? (
                  <div className="mt-4 p-3 border border-glitch-lime bg-glitch-lime/10 text-[11px] tracking-[0.2em] text-glitch-lime">
                    ✓ PURCHASE CONFIRMED
                    <a
                      href={`https://tzkt.io/${buyState.opHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-bone underline truncate"
                    >
                      {buyState.opHash.slice(0, 12)}… ↗
                    </a>
                  </div>
                ) : buyState.kind === "pending" ? (
                  <div className="mt-4 p-3 border border-glitch-cyan/50 bg-glitch-cyan/5 text-[11px] tracking-[0.2em] text-glitch-cyan animate-pulse">
                    ⟳ TX SENT · WAITING FOR CONFIRMATION...
                    <a
                      href={`https://tzkt.io/${buyState.opHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-bone underline truncate"
                    >
                      {buyState.opHash.slice(0, 12)}… ↗
                    </a>
                  </div>
                ) : null}

                {buyState.kind === "error" && (
                  <div className="mt-4 p-3 border border-glitch-red/50 bg-glitch-red/5 text-[11px] tracking-[0.2em] text-glitch-red space-y-2">
                    <div>✕ {buyState.message.toUpperCase()}</div>
                    <button
                      onClick={handleResetWallet}
                      className="w-full px-3 py-2 border border-glitch-red/60 text-glitch-red hover:bg-glitch-red/10 transition-colors"
                    >
                      RESET WALLET CONNECTION ↻
                    </button>
                  </div>
                )}

                {buyState.kind === "signing" && showStuckHint && (
                  <div className="mt-4 p-3 border border-glitch-cyan/40 bg-glitch-cyan/5 text-[11px] tracking-[0.2em] text-glitch-cyan space-y-2">
                    <div>
                      // KUKAI / TEMPLE NOT SHOWING THE REQUEST? RESET PAIRING
                      AND TRY AGAIN.
                    </div>
                    <button
                      onClick={handleResetWallet}
                      className="w-full px-3 py-2 border border-glitch-cyan/60 text-glitch-cyan hover:bg-glitch-cyan/10 transition-colors"
                    >
                      RESET WALLET CONNECTION ↻
                    </button>
                  </div>
                )}

                {canBuyOnSite && !address && !connecting && (
                  <div className="mt-4 p-3 border border-white/15 bg-white/5 text-[10px] tracking-[0.25em] text-ash leading-relaxed">
                    // KUKAI WILL OPEN IN A NEW TAB. IF NOTHING APPEARS,
                    YOUR BROWSER IS BLOCKING POPUPS — CHECK THE ADDRESS BAR
                    FOR A &quot;BLOCKED&quot; ICON OR ALLOW POPUPS FOR THIS
                    SITE AND CLICK CONNECT AGAIN.
                  </div>
                )}

                {canBuyOnSite && connecting && (
                  <div className="mt-4 p-3 border border-glitch-cyan/40 bg-glitch-cyan/5 text-[11px] tracking-[0.2em] text-glitch-cyan animate-pulse">
                    ⟳ OPENING WALLET... PICK KUKAI / TEMPLE / UMAMI ON THE
                    BEACON DIALOG.
                  </div>
                )}

                {canBuyOnSite && isOwnListing && (
                  <div className="mt-4 p-3 border border-glitch-cyan/40 bg-glitch-cyan/5 text-[11px] tracking-[0.2em] text-glitch-cyan space-y-2">
                    <div>
                      // YOU ARE CONNECTED WITH THE SELLER WALLET
                      ({address?.slice(0, 6)}…{address?.slice(-4)}). OBJKT
                      WON&apos;T LET YOU FULFILL YOUR OWN ASK.
                    </div>
                    <button
                      onClick={disconnect}
                      className="w-full px-3 py-2 border border-glitch-cyan/60 text-glitch-cyan hover:bg-glitch-cyan/10 transition-colors"
                    >
                      DISCONNECT &amp; USE A DIFFERENT WALLET
                    </button>
                  </div>
                )}

                {canBuyOnSite ? (
                  <button
                    onClick={handleBuy}
                    disabled={
                      buyState.kind === "signing" ||
                      buyState.kind === "pending" ||
                      connecting ||
                      isOwnListing
                    }
                    title={
                      isOwnListing
                        ? "Connected wallet is the seller. Switch wallets to collect."
                        : undefined
                    }
                    className="mt-4 group flex items-center justify-between gap-3 w-full px-5 py-3 bg-glitch-lime text-void text-xs tracking-[0.3em] uppercase font-bold hover:bg-bone disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>
                      {!address
                        ? "CONNECT WALLET TO BUY"
                        : isOwnListing
                        ? "CAN'T BUY YOUR OWN LISTING"
                        : buyState.kind === "signing"
                        ? "SIGN IN YOUR WALLET..."
                        : buyState.kind === "pending"
                        ? "PROCESSING TX..."
                        : `BUY · ${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} XTZ`}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                ) : (
                  <a
                    href={buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 group flex items-center justify-between gap-3 px-5 py-3 bg-glitch-lime text-void text-xs tracking-[0.3em] uppercase font-bold hover:bg-bone transition-colors"
                  >
                    <span>BUY ON OBJKT (FA TOKEN)</span>
                    <span>↗</span>
                  </a>
                )}

                <p className="mt-2 text-[9px] tracking-[0.2em] text-ash/70 leading-relaxed">
                  // SIGN WITH TEMPLE / KUKAI / UMAMI · ON-CHAIN TEZOS TX
                </p>
              </div>
            )}

            {status === "sold_out" && (
              <div className="border border-glitch-red/40 bg-glitch-red/5 p-5">
                <div className="text-[10px] tracking-[0.4em] text-glitch-red mb-1">
                  // STATUS
                </div>
                <div className="text-bone text-base">
                  All editions are sold.
                </div>
                <p className="mt-1 text-[11px] tracking-[0.2em] text-ash">
                  TRY THE SECONDARY MARKET
                </p>
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 group flex items-center justify-between gap-3 px-5 py-3 border border-white/20 text-xs tracking-[0.3em] uppercase text-bone hover:border-glitch-red hover:text-glitch-red transition-colors"
                >
                  <span>VIEW ON OBJKT</span>
                  <span>↗</span>
                </a>
              </div>
            )}

            {status === "in_collection" && (
              <div className="border border-white/10 p-5">
                <div className="text-[10px] tracking-[0.4em] text-ash mb-1">
                  // ARCHIVE
                </div>
                <div className="text-bone text-base">
                  Piece held by the creator, with no active listing.
                </div>
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 group flex items-center justify-between gap-3 px-5 py-3 border border-white/20 text-xs tracking-[0.3em] uppercase text-bone hover:border-glitch-cyan hover:text-glitch-cyan transition-colors"
                >
                  <span>VIEW ON OBJKT</span>
                  <span>↗</span>
                </a>
              </div>
            )}

            {/* Description */}
            {token.description && (
              <div>
                <div className="text-[10px] tracking-[0.4em] text-ash mb-2">
                  // DESCRIPTION
                </div>
                <p className="text-sm text-bone/90 leading-relaxed whitespace-pre-line">
                  {token.description}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-1.5 text-[11px] tracking-[0.25em] text-ash">
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span>FORMAT</span>
                <span className="text-bone font-mono">
                  {token.mime ?? "unknown"}
                </span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span>EDITIONS</span>
                <span className="text-bone">{editions}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span>CREATOR HOLDS</span>
                <span className="text-bone">{heldByCreator}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span>TOKEN_ID</span>
                <span className="text-bone font-mono">{token.token_id}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span>CONTRACT</span>
                <span className="text-bone font-mono truncate max-w-[200px]">
                  {token.fa_contract}
                </span>
              </div>
              {token.timestamp && (
                <div className="flex justify-between gap-6">
                  <span>MINTED</span>
                  <span className="text-bone font-mono">
                    {new Date(token.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
