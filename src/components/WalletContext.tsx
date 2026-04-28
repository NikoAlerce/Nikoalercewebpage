"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Regions,
  type NodeDistributions,
} from "@airgap/beacon-types";

type WalletState = {
  address: string | null;
  connecting: boolean;
  error: string | null;
};

type BuyArgs = {
  marketplaceContract: string;
  bigmapKey: number;
  priceMutez: number;
  currencyId: number;
  /** Nat %amount / %editions on some fulfill_ask schemas (editions to buy). */
  editions?: number;
  /**
   * Seller of the listing. Objkt's marketplace refuses to fulfill your own ask
   * (FAILWITH "M_NO_SELF_FULFILL"). Pass it so we can fail fast with a clear
   * message instead of letting the simulation explode.
   */
  sellerAddress?: string | null;
};

type BuyResult =
  | { ok: true; opHash: string }
  | { ok: false; error: string };

type Ctx = WalletState & {
  /** Resolves to tz1… after a successful permission request; null if user cancelled or error. */
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  /**
   * Full reset: tears down active account, paired peers, transport state and
   * cached singletons. Use when Kukai/Temple "no longer receive the request".
   */
  resetConnection: () => Promise<void>;
  buy: (args: BuyArgs) => Promise<BuyResult>;
};

const WalletCtx = createContext<Ctx | null>(null);

const activeAccountListeners = new Set<(addr: string | null) => void>();

function notifyActiveAccountListeners(addr: string | null) {
  for (const fn of activeAccountListeners) {
    try {
      fn(addr);
    } catch {
      /* ignore */
    }
  }
}

/** ExtractSchema() shape for Michelson `map` (see MapToken.ExtractSchema in Taquito). */
function isMichelsonMapSchemaNode(node: unknown): boolean {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  const o = node as Record<string, unknown>;
  if (!("map" in o) || typeof o.map !== "object" || o.map === null) return false;
  const inner = o.map as Record<string, unknown>;
  return "key" in inner && "value" in inner;
}

/**
 * Build the fulfill_ask parameter object from Taquito's ExtractSchema() so we
 * fill %amount / %editions, optional maps like %referrers (empty MichelsonMap),
 * etc., when the marketplace Michelson requires them.
 */
function fulfillAskParamsFromExtractedSchema(
  extracted: unknown,
  askKey: number,
  editions: number,
  MichelsonMap: typeof import("@taquito/michelson-encoder").MichelsonMap,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const editionsNat = Math.max(1, Math.floor(editions));

  if (!extracted || typeof extracted !== "object" || Array.isArray(extracted)) {
    out.ask_id = askKey;
    out.proxy = null;
    return out;
  }

  const shape = extracted as Record<string, unknown>;
  const askLike = new Set(["ask_id", "listing_id", "swap_id"]);

  for (const key of Object.keys(shape)) {
    const sub = shape[key];
    if (isMichelsonMapSchemaNode(sub)) {
      out[key] = new MichelsonMap();
      continue;
    }
    const lower = key.toLowerCase();
    if (askLike.has(key) || lower === "ask_id") {
      out[key] = askKey;
    } else if (key === "proxy") {
      out.proxy = null;
    } else if (key === "amount" || key === "editions") {
      out[key] = editionsNat;
    }
  }

  if (!Object.keys(out).some((k) => askLike.has(k) || k.toLowerCase() === "ask_id")) {
    out.ask_id = askKey;
  }
  if ("proxy" in shape && !("proxy" in out)) {
    out.proxy = null;
  }
  // e.g. %referrers as `map` — ensure we never leave map fields undefined
  for (const key of Object.keys(shape)) {
    if (!(key in out) && isMichelsonMapSchemaNode(shape[key])) {
      out[key] = new MichelsonMap();
    }
  }

  return out;
}

const RPC_URL =
  process.env.NEXT_PUBLIC_TEZOS_RPC ?? "https://mainnet.api.tez.ie";
const APP_NAME = "Niko Alerce // The Void";

/**
 * Beacon SDK 4.5.1 still ships bundle defaults that point at retired hosts
 * (`beacon-node-1.beacon-server-*.papers.tech` → NXDOMAIN) and others that
 * answer Synapse without browser CORS (`hope-*.papers.tech`). The Matrix client
 * probes `/…/beacon/info` via XHR first — every dead host burns latency and the
 * UI ends up at "No server responded." before a live relay is tried.
 *
 * Octez-hosted relays expose `Access-Control-Allow-Origin: *` and stay online.
 * Use them exclusively for every geographic bucket so init always resolves.
 *
 * Optional override (comma-separated hostnames, no scheme): set
 * NEXT_PUBLIC_BEACON_MATRIX_NODES on Vercel if these defaults ever move.
 */
const OCTEZ_MATRIX_RELAYS = [
  "beacon-node-1.octez.io",
  "beacon-node-2.octez.io",
  "beacon-node-3.octez.io",
  "beacon-node-4.octez.io",
  "beacon-node-5.octez.io",
  "beacon-node-6.octez.io",
  "beacon-node-7.octez.io",
  "beacon-node-8.octez.io",
];

function matrixNodesForAllRegions(): NodeDistributions {
  const raw = process.env.NEXT_PUBLIC_BEACON_MATRIX_NODES?.trim();
  const relays = raw
    ? raw.split(",").map((h) => h.trim()).filter(Boolean)
    : [...OCTEZ_MATRIX_RELAYS];
  return Object.fromEntries(
    Object.values(Regions).map((region) => [region, relays]),
  ) as NodeDistributions;
}

/**
 * Lazy-loaded modules de Taquito + Beacon. Se cargan solo cuando hace falta
 * para no inflar el bundle inicial.
 */
async function loadTezos() {
  const [
    { TezosToolkit },
    { BeaconWallet },
    beaconSdk,
    { BeaconEvent, getDAppClientInstance },
  ] = await Promise.all([
    import("@taquito/taquito"),
    import("@taquito/beacon-wallet"),
    import("@airgap/beacon-sdk"),
    import("@airgap/beacon-dapp"),
  ]);
  return { TezosToolkit, BeaconWallet, beaconSdk, BeaconEvent, getDAppClientInstance };
}

let cachedTezos: import("@taquito/taquito").TezosToolkit | null = null;
let cachedWallet: import("@taquito/beacon-wallet").BeaconWallet | null = null;
/**
 * Cache the beacon-sdk module too: `connect()` runs in the user-gesture path
 * for the popup, so we cannot afford another `await import(...)` after the
 * click. The first call (during pre-warm on mount) loads the chunk; every
 * later call reads from this cache synchronously.
 */
let cachedBeaconSdk: typeof import("@airgap/beacon-sdk") | null = null;
/** Avoid duplicate BeaconWallet / DAppClient init (e.g. React Strict Mode double mount). */
let walletInitInFlight: Promise<{
  Tezos: import("@taquito/taquito").TezosToolkit;
  wallet: import("@taquito/beacon-wallet").BeaconWallet;
}> | null = null;

async function getOrInitWallet() {
  if (cachedTezos && cachedWallet) {
    return { Tezos: cachedTezos, wallet: cachedWallet };
  }
  if (walletInitInFlight) {
    return walletInitInFlight;
  }
  walletInitInFlight = (async () => {
  const { TezosToolkit, BeaconWallet, beaconSdk, BeaconEvent, getDAppClientInstance } =
    await loadTezos();
  cachedBeaconSdk = beaconSdk;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "");
  const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const walletOptions = {
    name: APP_NAME,
    description: "Niko Alerce // The Void — Objkt gallery & collect.",
    appUrl: origin || undefined,
    ...(process.env.NEXT_PUBLIC_BEACON_ICON_URL
      ? { iconUrl: process.env.NEXT_PUBLIC_BEACON_ICON_URL }
      : {}),
    matrixNodes: matrixNodesForAllRegions(),
    preferredNetwork: beaconSdk.NetworkType.MAINNET,
    ...(wcProjectId
      ? { walletConnectOptions: { projectId: wcProjectId } }
      : {}),
  };
  /**
   * `@taquito/beacon-wallet` uses `getDAppClientInstance(options)` — a **module
   * singleton**. Whichever code path constructs the client **first** wins; later
   * calls ignore `matrixNodes`. If the first construction happened with an empty
   * config (or before our relays existed), `Client.matrixNodes` becomes `{}` and
   * P2P merges `{}` onto defaults → you keep probing dead `beacon-server-*.papers.tech`.
   *
   * Always `reset` before `new BeaconWallet` so THIS page load applies
   * `matrixNodes` (octez relays). disconnect() inside reset may throw if nothing
   * was connected — swallow.
   */
  try {
    getDAppClientInstance(walletOptions, true);
  } catch {
    /* ignore */
  }
  const wallet = new BeaconWallet(walletOptions);
  // Subscribe before any other async work so restored accounts do not warn
  // "no active subscription for ACTIVE_ACCOUNT_SET" (Beacon 4.x).
  await wallet.client.subscribeToEvent(
    BeaconEvent.ACTIVE_ACCOUNT_SET,
    async () => {
      const acc = await wallet.client.getActiveAccount();
      notifyActiveAccountListeners(acc?.address ?? null);
    },
  );
  // Eagerly resolve transports + key generation. WITHOUT this, the very first
  // `requestPermissions()` call awaits init() internally — which means by the
  // time the user picks "Kukai" in the wallet selection modal, the user-gesture
  // budget is gone and `window.open(kukaiUrl)` gets silently blocked by
  // Brave/Safari/strict Firefox. Pre-warming makes the click → window.open
  // path fully synchronous from the browser's POV.
  try {
    await wallet.client.init();
  } catch {
    // init() can throw if the transport list is unreachable; we still want
    // the wallet usable for postMessage (Temple) so swallow and continue.
  }
  const Tezos = new TezosToolkit(RPC_URL);
  Tezos.setWalletProvider(wallet);
  cachedTezos = Tezos;
  cachedWallet = wallet;
  return { Tezos, wallet };
  })();

  try {
    return await walletInitInFlight;
  } finally {
    walletInitInFlight = null;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session; ACTIVE_ACCOUNT_SET is subscribed inside getOrInitWallet().
  useEffect(() => {
    let cancelled = false;
    const listener = (addr: string | null) => {
      if (!cancelled) setAddress(addr);
    };
    activeAccountListeners.add(listener);
    (async () => {
      try {
        const { wallet } = await getOrInitWallet();
        const active = await wallet.client.getActiveAccount();
        if (!cancelled && active?.address) setAddress(active.address);
      } catch {
        // ignore: user never connected
      }
    })();
    return () => {
      cancelled = true;
      activeAccountListeners.delete(listener);
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    setConnecting(true);
    setError(null);
    try {
      // Try to grab a pre-warmed wallet *and* SDK without awaiting. If the
      // user clicked fast enough that pre-warm hasn't finished, fall back to
      // awaiting — the modal will still open but the popup may be blocked.
      const { wallet } =
        cachedTezos && cachedWallet
          ? { wallet: cachedWallet }
          : await getOrInitWallet();
      const sdk =
        cachedBeaconSdk ?? (await import("@airgap/beacon-sdk"));
      const { NetworkType, PermissionScope } = sdk;
      await wallet.requestPermissions({
        network: { type: NetworkType.MAINNET },
        scopes: [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN],
      });
      const pkh = await wallet.getPKH();
      setAddress(pkh);
      return pkh;
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Wallet connection failed";
      // Beacon raises "Connection timeout" / "NO_PEER" when the user picked a
      // wallet but the popup never returned a response. The most common
      // off-platform cause is a popup blocker; surface that explicitly.
      if (
        /timeout|NO_PEER|aborted|user closed|cancelled/i.test(msg) ||
        /no answer/i.test(msg)
      ) {
        msg =
          "Wallet did not respond. Make sure popups from this site are allowed and Kukai/Temple finished loading, then try again.";
      }
      setError(msg);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { wallet } = await getOrInitWallet();
      await wallet.clearActiveAccount();
    } catch {
      // ignore
    }
    setAddress(null);
  }, []);

  /**
   * Tear down everything Beacon persisted: active account, every paired peer
   * and the transport itself, then drop the cached singletons so the next
   * `connect()` rebuilds a fresh `BeaconWallet` and re-pairs from scratch.
   * This is the canonical "wallet doesn't see the request" recovery — Kukai
   * and Temple both ignore operation requests delivered over a stale matrix
   * room, and the only reliable fix is a clean re-pair.
   */
  const resetConnection = useCallback(async () => {
    try {
      const { wallet } = await getOrInitWallet();
      // Order matters: peers first (sends a "disconnect" message), then accounts.
      try {
        await wallet.client.removeAllPeers();
      } catch {
        /* ignore */
      }
      try {
        await wallet.client.removeAllAccounts();
      } catch {
        /* ignore */
      }
      try {
        await wallet.clearActiveAccount();
      } catch {
        /* ignore */
      }
      // Force the next request to build a brand new transport.
      try {
        // `destroy` exists on DAppClient in Beacon 4.x.
        const maybeDestroy = (wallet.client as unknown as { destroy?: () => Promise<void> })
          .destroy;
        if (typeof maybeDestroy === "function") {
          await maybeDestroy.call(wallet.client);
        }
      } catch {
        /* ignore */
      }
    } catch {
      // ignore: even if Beacon errored, we still drop our state below.
    }
    cachedTezos = null;
    cachedWallet = null;
    cachedBeaconSdk = null;
    walletInitInFlight = null;
    setAddress(null);
    setError(null);
  }, []);

  const buy = useCallback(
    async ({
      marketplaceContract,
      bigmapKey,
      priceMutez,
      currencyId,
      editions = 1,
      sellerAddress,
    }: BuyArgs): Promise<BuyResult> => {
      // Solo soportamos compras nativas en XTZ. Para FA1.2/FA2 hay que
      // hacer approve previo, redirigimos a Objkt para esos casos.
      if (currencyId !== 1) {
        return {
          ok: false,
          error: "THIS LISTING USES AN FA TOKEN. BUY IT FROM OBJKT.",
        };
      }
      const amt = Math.floor(Number(priceMutez));
      if (!Number.isFinite(amt) || amt <= 0) {
        return {
          ok: false,
          error: "LISTING PRICE IS INVALID. TRY AGAIN OR USE OBJKT.",
        };
      }
      const askKey = Math.floor(Number(bigmapKey));
      if (!Number.isFinite(askKey) || askKey < 0) {
        return {
          ok: false,
          error: "INVALID LISTING REFERENCE. OPEN THIS PIECE ON OBJKT.",
        };
      }
      const editionsBuy = Math.max(1, Math.floor(Number(editions)));
      try {
        const { Tezos, wallet } = await getOrInitWallet();
        const active = await wallet.client.getActiveAccount();
        if (!active?.address) {
          return { ok: false, error: "WALLET NOT CONNECTED" };
        }

        // Objkt v4 marketplace fails with "M_NO_SELF_FULFILL" if buyer == seller.
        // Detect it before the simulation so the user gets a clear message.
        if (
          sellerAddress &&
          active.address.toLowerCase() === sellerAddress.toLowerCase()
        ) {
          return {
            ok: false,
            error:
              "THIS IS YOUR OWN LISTING. CONNECT A DIFFERENT WALLET TO COLLECT IT.",
          };
        }

        const contract = await Tezos.wallet.at(marketplaceContract);
        const sendOpts = { amount: amt, mutez: true as const };

        // Objkt v4 (and variants): use entrypoint schema so optional %amount is set when required.
        if ("fulfill_ask" in contract.methodsObject) {
          const raw = contract.entrypoints?.entrypoints?.fulfill_ask;
          if (!raw) {
            return {
              ok: false,
              error: "MARKETPLACE CONTRACT HAS NO fulfill_ask. USE OBJKT.",
            };
          }
          const { ParameterSchema, MichelsonMap } = await import(
            "@taquito/michelson-encoder"
          );
          const extracted = new ParameterSchema(raw).ExtractSchema();
          const paramObj = fulfillAskParamsFromExtractedSchema(
            extracted,
            askKey,
            editionsBuy,
            MichelsonMap,
          );
          const op = await contract.methodsObject
            .fulfill_ask(paramObj)
            .send(sendOpts);
          return { ok: true, opHash: op.opHash };
        }

        if ("collect" in contract.methods) {
          const op = await contract.methods.collect(askKey).send(sendOpts);
          return { ok: true, opHash: op.opHash };
        }

        return {
          ok: false,
          error: "UNSUPPORTED MARKETPLACE FOR ON-SITE CHECKOUT. USE OBJKT.",
        };
      } catch (err) {
        let message = "Error signing the transaction";
        if (err instanceof Error) {
          message = err.message;
          // Friendlier messages for common errors
          if (/aborted/i.test(message)) message = "You cancelled the signature.";
          if (/not enough/i.test(message)) message = "Insufficient balance.";
          if (/no signer/i.test(message)) message = "Connect your wallet first.";
        }
        // Map Objkt v4 marketplace FAILWITH strings to friendly messages. The
        // raw failwith arrives as part of `err.message` or inside a nested
        // `errors[]` field on `MichelsonStorageView` / `TezosOperationError`.
        const blob =
          (err as { message?: string }).message +
          " " +
          JSON.stringify(
            (err as { errors?: unknown; data?: unknown }).errors ??
              (err as { data?: unknown }).data ??
              "",
          );
        if (/M_NO_SELF_FULFILL/.test(blob)) {
          message =
            "This is your own listing. Connect a different wallet to collect it.";
        } else if (/M_INSUFFICIENT_AMOUNT/.test(blob) || /amount.*too.*low/i.test(blob)) {
          message = "Listing price has changed. Reload and try again.";
        } else if (/M_NO_OFFER/.test(blob) || /M_NO_ASK/.test(blob)) {
          message = "This listing is no longer available.";
        } else if (/M_PAUSED/.test(blob)) {
          message = "Marketplace is paused. Try again later or use Objkt.";
        } else if (/balance_too_low/i.test(blob)) {
          message = "Insufficient XTZ balance to cover price + gas.";
        }
        return { ok: false, error: message };
      }
    },
    [],
  );

  return (
    <WalletCtx.Provider
      value={{
        address,
        connecting,
        error,
        connect,
        disconnect,
        resetConnection,
        buy,
      }}
    >
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet(): Ctx {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
