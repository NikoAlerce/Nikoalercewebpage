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
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "");
  const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const wallet = new BeaconWallet({
    name: APP_NAME,
    description: "Niko Alerce // The Void — Objkt gallery & collect.",
    appUrl: origin || undefined,
    ...(process.env.NEXT_PUBLIC_BEACON_ICON_URL
      ? { iconUrl: process.env.NEXT_PUBLIC_BEACON_ICON_URL }
      : {}),
    preferredNetwork: beaconSdk.NetworkType.MAINNET,
    ...(wcProjectId
      ? { walletConnectOptions: { projectId: wcProjectId } }
      : {}),
  });
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

  // Restore session on mount (Beacon persists in localStorage)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wallet } = await getOrInitWallet();
        const active = await wallet.client.getActiveAccount();
        if (!cancelled && active?.address) setAddress(active.address);
      } catch (err) {
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
      try {
        const { Tezos, wallet } = await getOrInitWallet();
        const active = await wallet.client.getActiveAccount();
        if (!active?.address) {
          return { ok: false, error: "WALLET NOT CONNECTED" };
        }

        const contract = await Tezos.wallet.at(marketplaceContract);

        // The standard method in Objkt v3/v4 marketplaces is
        // `fulfill_ask` y recibe el ask_id (= bigmap_key del listing).
        // Algunos contratos lo llaman `collect`, hacemos un fallback.
        const methodName =
          "fulfill_ask" in contract.methods ? "fulfill_ask" : "collect";

        const op = await contract.methods[methodName](bigmapKey).send({
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
