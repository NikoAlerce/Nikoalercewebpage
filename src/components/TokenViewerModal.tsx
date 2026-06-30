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
    <div className="absolute inset-0 grid place-items-center text-[10px] tracking-[0.3em] uppercase text-ash animate-pulse">
      Loading 3D…
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
    if (!token || !listing) return;
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
        window.dispatchEvent(
          new CustomEvent("nft-bought", {
            detail: { tokenId: token.token_id, price },
          })
        );
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
      onClick={(e) => {
        // Close when clicking outside the modal content
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      {/* TOP BAR */}
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/10 bg-void/80">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-ash min-w-0">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shrink-0" />
          <span className="truncate normal-case tracking-normal text-bone/90 font-sans">
            {token.name ?? "untitled"}
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
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase border border-white/20 text-bone hover:border-accent hover:text-accent transition-colors"
              title="Disconnect wallet"
            >
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              {address.slice(0, 6)}…{address.slice(-4)}
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="hidden md:block px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase border border-white/15 text-ash hover:border-bone hover:text-bone disabled:opacity-50 transition-colors"
            >
              {connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
          <button
            onClick={close}
            aria-label="Close"
            className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-[0.25em] uppercase border border-accent/50 text-accent hover:bg-accent/10 transition-colors"
          >
            <span>✕</span>
            <span className="hidden md:inline">Close</span>
          </button>
        </div>
      </header>

      {/* BODY — on mobile it's a single scrolling column; on desktop a 2-col split with the
          panel scrolling internally. */}
      <div className="flex-1 grid lg:grid-cols-[1fr_400px] min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* VIEWER */}
        <div className="relative bg-black overflow-hidden min-h-[55vh] lg:min-h-0">
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
            <div className="absolute inset-0 grid place-items-center text-[10px] tracking-[0.3em] uppercase text-ash">
              No media
            </div>
          )}
        </div>

        {/* PANEL */}
        <aside className="border-t lg:border-t-0 lg:border-l border-white/10 lg:overflow-y-auto bg-void">
          <div className="p-6 space-y-6">
            <div>
              <div
                className={
                  "flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-3 " +
                  (status === "sold_out" ? "text-accent" : "text-ash")
                }
              >
                <span
                  className={
                    "w-1.5 h-1.5 rounded-full " +
                    (status === "for_sale" ? "bg-accent" : "bg-ash/50")
                  }
                />
                {status === "for_sale"
                  ? "Available"
                  : status === "sold_out"
                  ? "Sold out"
                  : "Archive"}
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-bone leading-tight">
                {token.name ?? "untitled"}
              </h3>
              <p className="mt-2 text-[12px] text-ash">
                by {creatorName}
              </p>
            </div>

            {/* PURCHASE */}
            {status === "for_sale" && price !== null && (
              <div className="border border-white/12 bg-white/[0.03] p-5">
                <div className="text-[10px] tracking-[0.3em] uppercase text-ash mb-1">
                  Price
                </div>
                <div className="font-mono text-3xl text-bone">
                  {price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} XTZ
                </div>
                {amountLeft > 0 && (
                  <div className="mt-1 text-[11px] tracking-[0.15em] text-ash">
                    {amountLeft} edition{amountLeft !== 1 ? "s" : ""} available
                  </div>
                )}

                {/* Purchase state */}
                {buyState.kind === "success" ? (
                  <div className="mt-4 p-3 border border-accent/50 bg-accent/10 text-[11px] tracking-[0.15em] text-bone">
                    ✓ Purchase confirmed
                    <a
                      href={`https://tzkt.io/${buyState.opHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-accent link-underline truncate"
                    >
                      {buyState.opHash.slice(0, 12)}… ↗
                    </a>
                  </div>
                ) : buyState.kind === "pending" ? (
                  <div className="mt-4 p-3 border border-white/20 bg-white/5 text-[11px] tracking-[0.15em] text-bone animate-pulse">
                    ⟳ Transaction sent · waiting for confirmation…
                    <a
                      href={`https://tzkt.io/${buyState.opHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-accent link-underline truncate"
                    >
                      {buyState.opHash.slice(0, 12)}… ↗
                    </a>
                  </div>
                ) : null}

                {buyState.kind === "error" && (
                  <div className="mt-4 p-3 border border-accent/50 bg-accent/5 text-[11px] tracking-[0.15em] text-accent space-y-2">
                    <div>✕ {buyState.message}</div>
                    <button
                      onClick={handleResetWallet}
                      className="w-full px-3 py-2 border border-accent/60 text-accent hover:bg-accent/10 transition-colors uppercase tracking-[0.2em]"
                    >
                      Reset wallet connection ↻
                    </button>
                  </div>
                )}

                {buyState.kind === "signing" && showStuckHint && (
                  <div className="mt-4 p-3 border border-white/20 bg-white/5 text-[11px] tracking-[0.15em] text-bone space-y-2">
                    <div>
                      Kukai / Temple not showing the request? Reset the pairing
                      and try again.
                    </div>
                    <button
                      onClick={handleResetWallet}
                      className="w-full px-3 py-2 border border-bone/40 text-bone hover:bg-white/5 transition-colors uppercase tracking-[0.2em]"
                    >
                      Reset wallet connection ↻
                    </button>
                  </div>
                )}

                {canBuyOnSite && !address && !connecting && (
                  <div className="mt-4 p-3 border border-white/15 bg-white/5 text-[11px] tracking-[0.1em] text-ash leading-relaxed">
                    Kukai will open in a new tab. If nothing appears, your browser
                    is blocking popups — check the address bar for a
                    &quot;blocked&quot; icon, or allow popups for this site and
                    click connect again.
                  </div>
                )}

                {canBuyOnSite && connecting && (
                  <div className="mt-4 p-3 border border-white/20 bg-white/5 text-[11px] tracking-[0.15em] text-bone animate-pulse">
                    ⟳ Opening wallet… pick Kukai / Temple / Umami on the Beacon
                    dialog.
                  </div>
                )}

                {canBuyOnSite && isOwnListing && (
                  <div className="mt-4 p-3 border border-white/20 bg-white/5 text-[11px] tracking-[0.15em] text-bone space-y-2">
                    <div>
                      You&apos;re connected with the seller wallet
                      ({address?.slice(0, 6)}…{address?.slice(-4)}). Objkt
                      won&apos;t let you fulfill your own ask.
                    </div>
                    <button
                      onClick={disconnect}
                      className="w-full px-3 py-2 border border-bone/40 text-bone hover:bg-white/5 transition-colors uppercase tracking-[0.2em]"
                    >
                      Disconnect &amp; use a different wallet
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
                    className="mt-4 group flex items-center justify-between gap-3 w-full px-5 py-3 bg-accent text-void text-xs tracking-[0.25em] uppercase font-semibold hover:bg-accent-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>
                      {!address
                        ? "Connect wallet to buy"
                        : isOwnListing
                        ? "Can't buy your own listing"
                        : buyState.kind === "signing"
                        ? "Sign in your wallet…"
                        : buyState.kind === "pending"
                        ? "Processing tx…"
                        : `Buy · ${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} XTZ`}
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
                    className="mt-4 group flex items-center justify-between gap-3 px-5 py-3 bg-accent text-void text-xs tracking-[0.25em] uppercase font-semibold hover:bg-accent-soft transition-colors"
                  >
                    <span>Buy on Objkt (FA token)</span>
                    <span>↗</span>
                  </a>
                )}

                <p className="mt-3 text-[10px] tracking-[0.15em] text-ash/70 leading-relaxed">
                  Sign with Temple / Kukai / Umami · on-chain Tezos tx
                </p>
              </div>
            )}

            {status === "sold_out" && (
              <div className="border border-accent/40 bg-accent/5 p-5">
                <div className="text-[10px] tracking-[0.3em] uppercase text-accent mb-1">
                  Sold out
                </div>
                <div className="text-bone text-base">
                  All editions are sold.
                </div>
                <p className="mt-1 text-[11px] tracking-[0.15em] text-ash">
                  Try the secondary market
                </p>
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 group flex items-center justify-between gap-3 px-5 py-3 border border-white/20 text-xs tracking-[0.25em] uppercase text-bone hover:border-accent hover:text-accent transition-colors"
                >
                  <span>View on Objkt</span>
                  <span>↗</span>
                </a>
              </div>
            )}

            {status === "in_collection" && (
              <div className="border border-white/10 p-5">
                <div className="text-[10px] tracking-[0.3em] uppercase text-ash mb-1">
                  Archive
                </div>
                <div className="text-bone text-base">
                  Piece held by the creator, with no active listing.
                </div>
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 group flex items-center justify-between gap-3 px-5 py-3 border border-white/20 text-xs tracking-[0.25em] uppercase text-bone hover:border-accent hover:text-accent transition-colors"
                >
                  <span>View on Objkt</span>
                  <span>↗</span>
                </a>
              </div>
            )}

            {/* Description */}
            {token.description && (
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-ash mb-2">
                  Description
                </div>
                <p className="text-sm text-bone/90 leading-relaxed whitespace-pre-line">
                  {token.description}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-1.5 text-[11px] tracking-[0.15em] text-ash">
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span className="uppercase tracking-[0.2em] text-[10px] self-center">Format</span>
                <span className="text-bone font-mono">
                  {token.mime ?? "unknown"}
                </span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span className="uppercase tracking-[0.2em] text-[10px] self-center">Editions</span>
                <span className="text-bone">{editions}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span className="uppercase tracking-[0.2em] text-[10px] self-center">Creator holds</span>
                <span className="text-bone">{heldByCreator}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span className="uppercase tracking-[0.2em] text-[10px] self-center">Token ID</span>
                <span className="text-bone font-mono">{token.token_id}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5">
                <span className="uppercase tracking-[0.2em] text-[10px] self-center">Contract</span>
                <span className="text-bone font-mono truncate max-w-[200px]">
                  {token.fa_contract}
                </span>
              </div>
              {token.timestamp && (
                <div className="flex justify-between gap-6">
                  <span className="uppercase tracking-[0.2em] text-[10px] self-center">Minted</span>
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
