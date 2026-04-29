import type { Metadata } from "next";
import NFTGallery from "@/components/NFTGallery";

export const metadata: Metadata = {
  title: "Works",
  description:
    "3D and glitch works by Niko Alerce, synced live with Tezos via Objkt.",
};

export default function WorksPage() {
  return (
    <div className="pt-20">
      <NFTGallery
        id="works"
        alias="nikoalerce"
        title="WORKS"
        subtitle="Gallery synced with Tezos. Open a piece to view the real artifact in high quality and collect it."
        accent="gold"
      />
    </div>
  );
}
