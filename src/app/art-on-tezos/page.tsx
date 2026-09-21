import type { Metadata } from "next";
import ArtOnTezos from "@/components/ArtOnTezos";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Art on Tezos",
  description:
    "Art on Tezos by Niko Alerce — Works and Sidequest, synced with Objkt. Explore collections and sort pieces by date or price.",
};

export default async function ArtOnTezosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab === "transient") permanentRedirect("/art-on-evm");
  return (
    <div className="pt-20">
      <ArtOnTezos key={tab ?? "works"} initialTab={tab} />
    </div>
  );
}
