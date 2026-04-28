"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
};

type BuyResult =
  | { ok: true; opHash: string }
  | { ok: false; error: string };

type Ctx = WalletState & {
  /** Resolves to tz1… after a successful permission request; null if user cancelled or error. */
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  buy: (args: BuyArgs) => Promise<BuyResult>;
};

const WalletCtx = createContext<Ctx | null>(null);

const RPC_URL =
  process.env.NEXT_PUBLIC_TEZOS_RPC ?? "https://mainnet.api.tez.ie";
const APP_NAME = "Niko Alerce // The Void";

/**
 * Beacon 4.5.1 still maps some regions to retired `beacon-server-*.papers.tech`
 * (NXDOMAIN). Several `*.papers.tech` nodes also return 403/CORS from the
 * browser; `*.octez.io` relays respond with `Access-Control-Allow-Origin: *`.
 * Keep papers nodes only as fallback after octez.
 */
const WORKING_BEACON_RELAYS: string[] = [
  "beacon-node-1.octez.io",
  "beacon-node-2.octez.io",
  "beacon-node-3.octez.io",
  "beacon-node-4.octez.io",
  "beacon-node-5.octez.io",
  "beacon-node-6.octez.io",
  "beacon-node-7.octez.io",
  "beacon-node-8.octez.io",
  "beacon-node-1.diamond.papers.tech",
  "beacon-node-1.sky.papers.tech",
  "beacon-node-2.sky.papers.tech",
  "beacon-node-1.hope.papers.tech",
  "beacon-node-1.hope-2.papers.tech",
  "beacon-node-1.hope-3.papers.tech",
  "beacon-node-1.hope-4.papers.tech",
];

function matrixNodesForAllRegions(
  Regions: typeof import("@airgap/beacon-sdk").Regions,
): import("@airgap/beacon-types").NodeDistributions {
  const relays = [...WORKING_BEACON_RELAYS];
  return Object.fromEntries(
    Object.values(Regions).map((region) => [region, relays]),
  );
}

/**
 * Lazy-loaded modules de Taquito + Beacon. Se cargan solo cuando hace falta
 * para no inflar el bundle inicial.
 */
async function loadTezos() {
  const [{ TezosToolkit }, { BeaconWallet }, beaconSdk] = await Promise.all([
    import("@taquito/taquito"),
    import("@taquito/beacon-wallet"),
    import("@airgap/beacon-sdk"),
  ]);
  return { TezosToolkit, BeaconWallet, beaconSdk };
}

let cachedTezos: import("@taquito/taquito").TezosToolkit | null = null;
let cachedWallet: import("@taquito/beacon-wallet").BeaconWallet | null = null;

async function getOrInitWallet() {
  if (cachedTezos && cachedWallet) {
    return { Tezos: cachedTezos, wallet: cachedWallet };
  }
  const { TezosToolkit, BeaconWallet, beaconSdk } = await loadTezos();
  const { getDAppClientInstance } = await import("@airgap/beacon-dapp");
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
    matrixNodes: matrixNodesForAllRegions(beaconSdk.Regions),
    preferredNetwork: beaconSdk.NetworkType.MAINNET,
    ...(wcProjectId
      ? { walletConnectOptions: { projectId: wcProjectId } }
      : {}),
  };
  // Taquito uses a process-wide DAppClient singleton; a previous init (HMR,
  // extension, or older bundle) can leave stale config that ignores matrixNodes.
  getDAppClientInstance(walletOptions, true);
  const wallet = new BeaconWallet(walletOptions);
  const Tezos = new TezosToolkit(RPC_URL);
  Tezos.setWalletProvider(wallet);
  cachedTezos = Tezos;
  cachedWallet = wallet;
  return { Tezos, wallet };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session + subscribe so ACTIVE_ACCOUNT_SET is handled (Beacon 4.x).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wallet } = await getOrInitWallet();
        const { BeaconEvent } = await import("@airgap/beacon-dapp");
        await wallet.client.subscribeToEvent(
          BeaconEvent.ACTIVE_ACCOUNT_SET,
          async () => {
            const acc = await wallet.client.getActiveAccount();
            if (!cancelled) setAddress(acc?.address ?? null);
          },
        );
        const active = await wallet.client.getActiveAccount();
        if (!cancelled && active?.address) setAddress(active.address);
      } catch {
        // ignore: user never connected
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    setConnecting(true);
    setError(null);
    try {
      const { wallet } = await getOrInitWallet();
      const { NetworkType, PermissionScope } = await import(
        "@airgap/beacon-sdk"
      );
      await wallet.requestPermissions({
        network: { type: NetworkType.MAINNET },
        scopes: [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN],
      });
      const pkh = await wallet.getPKH();
      setAddress(pkh);
      return pkh;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
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

  const buy = useCallback(
    async ({
      marketplaceContract,
      bigmapKey,
      priceMutez,
      currencyId,
    }: BuyArgs): Promise<BuyResult> => {
      // Solo soportamos compras nativas en XTZ. Para FA1.2/FA2 hay que
      // hacer approve previo, redirigimos a Objkt para esos casos.
      if (currencyId !== 1) {
        return {
          ok: false,
          error: "THIS LISTING USES AN FA TOKEN. BUY IT FROM OBJKT.",
        };
      }
      if (!Number.isFinite(priceMutez) || priceMutez <= 0) {
        return {
          ok: false,
          error: "LISTING PRICE IS INVALID. TRY AGAIN OR USE OBJKT.",
        };
      }
      try {
        const { Tezos, wallet } = await getOrInitWallet();
        const active = await wallet.client.getActiveAccount();
        if (!active?.address) {
          return { ok: false, error: "WALLET NOT CONNECTED" };
        }

        const contract = await Tezos.wallet.at(marketplaceContract);

        // Objkt marketplace v4: parameter is (pair nat (option address)) with %ask_id / %proxy.
        // `contract.methods` = flattened args only; objects belong in `methodsObject`.
        const op =
          "fulfill_ask" in contract.methodsObject
            ? await contract.methodsObject
                .fulfill_ask({ ask_id: bigmapKey, proxy: null })
                .send({ amount: priceMutez, mutez: true })
            : await contract.methods.collect(bigmapKey).send({
                amount: priceMutez,
                mutez: true,
              });

        return { ok: true, opHash: op.opHash };
      } catch (err) {
        let message = "Error signing the transaction";
        if (err instanceof Error) {
          message = err.message;
          // Friendlier messages for common errors
          if (/aborted/i.test(message)) message = "You cancelled the signature.";
          if (/not enough/i.test(message)) message = "Insufficient balance.";
          if (/no signer/i.test(message)) message = "Connect your wallet first.";
        }
        return { ok: false, error: message };
      }
    },
    [],
  );

  return (
    <WalletCtx.Provider
      value={{ address, connecting, error, connect, disconnect, buy }}
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
