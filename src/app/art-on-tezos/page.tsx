import type { Metadata } from "next";
import ArtOnTezos from "@/components/ArtOnTezos";

export const metadata: Metadata = {
  title: "Art on Tezos",
  description:
    "Art by Niko Alerce — Works and Sidequest on Tezos, plus artworks on Transient. Explore collections and sort Tezos pieces by date or price.",
};

export default async function ArtOnTezosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return (
    <div className="pt-20">
      <ArtOnTezos key={tab ?? "works"} initialTab={tab} />
    </div>
  );
}
