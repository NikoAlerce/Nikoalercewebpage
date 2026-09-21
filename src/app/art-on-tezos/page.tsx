import type { Metadata } from "next";
import ArtOnTezos from "@/components/ArtOnTezos";

export const metadata: Metadata = {
  title: "Art on Tezos",
  description:
    "Art on Tezos by Niko Alerce — two collections synced live with Objkt: Works (the main gallery) and Sidequest (the experiments). Open a piece to collect it on-chain.",
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
