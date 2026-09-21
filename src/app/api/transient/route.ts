import { fetchTransientArtworks } from "@/lib/transient";

export async function GET() {
  try {
    return Response.json({ artworks: await fetchTransientArtworks() }, { headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    } });
  } catch {
    return Response.json({ error: "Transient temporarily unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
