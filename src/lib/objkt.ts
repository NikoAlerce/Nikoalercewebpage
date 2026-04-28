import { GraphQLClient, gql } from "graphql-request";
import type { ObjktHolder, ObjktListing, ObjktToken } from "./types";

export const OBJKT_GRAPHQL =
  process.env.NEXT_PUBLIC_OBJKT_GRAPHQL ?? "https://data.objkt.com/v3/graphql";

export const objktClient = new GraphQLClient(OBJKT_GRAPHQL, {
  headers: { "content-type": "application/json" },
});

/**
 * Slugs conocidos en Objkt → wallet.
 * El "@slug" en la URL de Objkt no siempre coincide con el campo `alias` de la
 * database alias (which may include spaces and uppercase letters), so we keep an
 * explicit map for site aliases. Any other alias is resolved dynamically via
 * `_ilike`.
 */
export const ALIAS_TO_WALLET: Record<string, string> = {
  nikoalerce: "tz1WNzaqX3KWbBbGtDJRR4Z7ZcVQRpKqcizb", // alias en DB: "Niko Alerce"
  sidequest: "tz1YSF1SJA9AAKQHaTFGGH98NDqowxdH1XWU", // alias en DB: "SideQuest"
};

const HOLDER_BY_ADDRESS = gql`
  query HolderByAddress($address: String!) {
    holder(where: { address: { _eq: $address } }, limit: 1) {
      address
      alias
      description
      twitter
      website
    }
  }
`;

const HOLDER_BY_ALIAS_FUZZY = gql`
  query HolderByAliasFuzzy($needle: String!) {
    holder(
      where: { alias: { _ilike: $needle } }
      order_by: { alias: asc }
      limit: 5
    ) {
      address
      alias
      description
      twitter
      website
    }
  }
`;

const TOKENS_BY_CREATOR = gql`
  query TokensByCreator(
    $address: String!
    $limit: Int = 300
    $offset: Int = 0
  ) {
    token(
      where: {
        creators: { creator_address: { _eq: $address } }
      }
      order_by: { timestamp: desc }
      limit: $limit
      offset: $offset
    ) {
      pk
      token_id
      name
      description
      display_uri
      artifact_uri
      thumbnail_uri
      mime
      fa_contract
      timestamp
      supply
      lowest_ask
      listings_active(
        where: { seller_address: { _eq: $address } }
        order_by: { price_xtz: asc }
        limit: 1
      ) {
        id
        bigmap_key
        marketplace_contract
        currency_id
        price
        price_xtz
        amount
        amount_left
        seller_address
      }
      open_edition_active {
        end_time
        price
      }
      creator_holdings: holders(
        where: { holder_address: { _eq: $address } }
        limit: 1
      ) {
        quantity
      }
      creators {
        holder {
          address
          alias
        }
      }
    }
  }
`;

type TokensResponse = { token: ObjktToken[] };
type HolderResponse = { holder: ObjktHolder[] };

const aliasResolutionCache = new Map<string, string | null>();

/**
 * Resuelve un alias/slug a una wallet tz1...
 * First uses the static `ALIAS_TO_WALLET` map, then tries `_ilike`.
 * usando el alias como needle (case-insensitive, partial match).
 */
export async function resolveAliasToWallet(
  alias: string,
): Promise<string | null> {
  const norm = alias.trim().toLowerCase();
  if (aliasResolutionCache.has(norm)) {
    return aliasResolutionCache.get(norm) ?? null;
  }
  if (ALIAS_TO_WALLET[norm]) {
    aliasResolutionCache.set(norm, ALIAS_TO_WALLET[norm]);
    return ALIAS_TO_WALLET[norm];
  }
  if (alias.startsWith("tz")) {
    aliasResolutionCache.set(norm, alias);
    return alias;
  }
  try {
    const data = await objktClient.request<HolderResponse>(
      HOLDER_BY_ALIAS_FUZZY,
      { needle: `%${alias}%` },
    );
    const found = data.holder?.[0]?.address ?? null;
    aliasResolutionCache.set(norm, found);
    return found;
  } catch (err) {
    console.error("[objkt] resolveAliasToWallet error", alias, err);
    aliasResolutionCache.set(norm, null);
    return null;
  }
}

export async function fetchHolder(
  address: string,
): Promise<ObjktHolder | null> {
  try {
    const data = await objktClient.request<HolderResponse>(HOLDER_BY_ADDRESS, {
      address,
    });
    return data.holder?.[0] ?? null;
  } catch (err) {
    console.error("[objkt] fetchHolder error", address, err);
    return null;
  }
}

export async function fetchTokensByCreator(
  address: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<ObjktToken[]> {
  const { limit = 60, offset = 0 } = opts;
  try {
    const data = await objktClient.request<TokensResponse>(TOKENS_BY_CREATOR, {
      address,
      limit,
      offset,
    });
    return data.token ?? [];
  } catch (err) {
    console.error("[objkt] fetchTokensByCreator error", address, err);
    return [];
  }
}

/**
 * Path de alto nivel: dado un alias o wallet, devuelve holder + tokens creados.
 */
export async function fetchCreatorBundle(
  aliasOrWallet: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ address: string | null; holder: ObjktHolder | null; tokens: ObjktToken[] }> {
  const address = await resolveAliasToWallet(aliasOrWallet);
  if (!address) return { address: null, holder: null, tokens: [] };
  const [holder, tokens] = await Promise.all([
    fetchHolder(address),
    fetchTokensByCreator(address, opts),
  ]);
  return { address, holder, tokens };
}

/**
 * Public IPFS gateways in preference order.
 * Se usan como fallback progresivo en MediaRenderer cuando el primero falla.
 */
export const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://dweb.link/ipfs/",
];

/**
 * Convierte un URI ipfs:// en una URL HTTP servible usando el primer gateway.
 */
export function ipfsToUrl(
  uri: string | null | undefined,
): string | null {
  if (!uri) return null;
  if (uri.startsWith("http")) return uri;
  if (!uri.startsWith("ipfs://")) return uri;
  const cid = uri.replace("ipfs://", "");
  return `${IPFS_GATEWAYS[0]}${cid}`;
}

/**
 * Given a CID (or ipfs:// URI), returns the URL with the gateway at the given index.
 */
export function ipfsWithGateway(
  uri: string | null | undefined,
  gatewayIndex: number,
): string | null {
  if (!uri) return null;
  const cid = uri.startsWith("ipfs://") ? uri.replace("ipfs://", "") : uri;
  const gw = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  return `${gw}${cid}`;
}

export function objktTokenUrl(t: ObjktToken): string {
  return `https://objkt.com/asset/${t.fa_contract}/${t.token_id}`;
}

type Token = import("./types").ObjktToken;
type Status = import("./types").TokenStatus;

/** Number of editions the creator still holds. */
export function creatorHoldsQuantity(token: Token): number {
  return token.creator_holdings?.[0]?.quantity ?? 0;
}

/** Number of creator-owned editions still available to sell (unsold). */
export function activeListingAmountLeft(token: Token): number {
  return token.listings_active?.[0]?.amount_left ?? 0;
}

/** true if the token has an active creator listing with editions left to sell. */
export function isForSale(token: Token): boolean {
  if ((token.listings_active?.length ?? 0) > 0) {
    return activeListingAmountLeft(token) > 0;
  }
  if (token.open_edition_active) return true;
  return false;
}

/** Burned tokens usually come back from Objkt with supply = 0. */
export function isBurnedToken(token: Token): boolean {
  const supply = token.supply ?? 0;
  return supply <= 0 && !isForSale(token) && !token.open_edition_active;
}

/** Tokens that should be shown publicly in the galleries. */
export function isDisplayableToken(token: Token): boolean {
  return !isBurnedToken(token);
}

/**
 * Fully sold out: the creator no longer holds any editions.
 * If supply > 0 and holdings = 0, all editions changed hands.
 */
export function isSoldOut(token: Token): boolean {
  if (isForSale(token)) return false;
  return creatorHoldsQuantity(token) === 0;
}

/** High-level token status from the creator's perspective. */
export function tokenStatus(token: Token): Status {
  if (isForSale(token)) return "for_sale";
  if (creatorHoldsQuantity(token) === 0) return "sold_out";
  return "in_collection";
}

/**
 * Listing price in mutez for Tezos `send({ amount, mutez: true })`.
 * Objkt exposes `price` in listing currency and `price_xtz` (mutez) for XTZ-equivalent;
 * either may be present depending on indexer shape.
 */
export function listingPriceMutez(
  listing: ObjktListing | null | undefined,
): number | null {
  if (!listing) return null;
  const p =
    typeof listing.price === "number" && Number.isFinite(listing.price)
      ? listing.price
      : typeof listing.price_xtz === "number" &&
          Number.isFinite(listing.price_xtz)
        ? listing.price_xtz
        : null;
  if (p == null || p <= 0) return null;
  return Math.floor(p);
}

/** Price in XTZ of the creator's lowest active listing. */
export function lowestPriceXtz(token: Token): number | null {
  const listing = token.listings_active?.[0];
  const mutez =
    listingPriceMutez(listing) ??
    (typeof token.lowest_ask === "number" && Number.isFinite(token.lowest_ask)
      ? token.lowest_ask
      : null);
  if (mutez === null) return null;
  return mutez / 1_000_000;
}

/**
 * Display-ready editions label:
 * - Active open edition -> "OPEN EDITION"
 * - supply > 0 -> "ED. X" (or "X / Y" if editions are left)
 * - no supply -> "1/1"
 */
export function editionsLabel(token: Token): string {
  if (token.open_edition_active) return "OPEN EDITION";
  const supply = token.supply ?? 0;
  if (supply <= 0) return "1/1";
  const left = activeListingAmountLeft(token);
  if (left > 0 && left < supply) {
    return `${left}/${supply}`;
  }
  return `ED. ${supply}`;
}

export function detectKind(
  mime?: string | null,
): "video" | "image" | "model" | "html" | "audio" | "unknown" {
  if (!mime) return "unknown";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "model/gltf-binary" || mime === "model/gltf+json") return "model";
  if (mime === "application/x-directory" || mime === "text/html") return "html";
  return "unknown";
}
