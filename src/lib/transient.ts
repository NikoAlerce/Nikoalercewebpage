export type TransientArtwork = {
  id: string; name: string; url: string; image: string | null;
  createdAt: string | null; collection: string; chain: string;
};

const PROFILE_ID = 13262;
type RawArtwork = {
  id: number; name?: string; uri?: string; image_uri?: string; created_at?: string;
  is_valid?: boolean;
  nft_contract?: { name?: string; user?: { id?: number }; address?: { chain?: string } };
};

export function normalizeTransientArtwork(raw: RawArtwork): TransientArtwork | null {
  if (!raw.is_valid || raw.nft_contract?.user?.id !== PROFILE_ID || !raw.uri ||
      !/^\/nfts\/[a-z0-9-]+\/0x[a-fA-F0-9]{40}\/\d+$/.test(raw.uri)) return null;
  let image: string | null = null;
  try {
    const url = new URL(raw.image_uri ?? "");
    if (url.protocol === "https:" && !url.username && !url.password &&
      ["ipfs.transientusercontent.xyz", "dae.transientusercontent.xyz", "arweave.net"].includes(url.hostname)) image = url.href;
  } catch { /* Missing image remains an explicit placeholder. */ }
  return { id: String(raw.id), name: raw.name || "Untitled", url: `https://www.transient.xyz${raw.uri}`,
    image, createdAt: raw.created_at ?? null, collection: raw.nft_contract?.name ?? "Transient",
    chain: raw.nft_contract?.address?.chain === "8453" ? "Base" : raw.nft_contract?.address?.chain === "1" ? "Ethereum" : "EVM" };
}

export async function fetchTransientArtworks(): Promise<TransientArtwork[]> {
  const results = new Map<string, TransientArtwork>();
  // Fixed creator filter, bounded pagination; never follow an arbitrary upstream URL.
  for (let offset = 0; offset < 1000; offset += 100) {
    const response = await fetch(`https://api.transient.xyz/v1/catalog/nfts?user_id=${PROFILE_ID}&limit=100&offset=${offset}&order=-created_at`, {
      signal: AbortSignal.timeout(12000), next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error("Transient unavailable");
    const data = await response.json() as { count: number; results: RawArtwork[] };
    if (!Array.isArray(data.results) || !Number.isInteger(data.count)) throw new Error("Invalid Transient response");
    for (const raw of data.results) {
      const item = normalizeTransientArtwork(raw);
      if (item) results.set(item.id, item);
    }
    if (offset + data.results.length >= data.count) return [...results.values()];
    if (!data.results.length) throw new Error("Incomplete Transient response");
  }
  throw new Error("Transient collection exceeds supported limit");
}
