import type { Metadata } from "next";
import TransientGallery from "@/components/TransientGallery";

export const metadata: Metadata = {
  title: "Art on EVM",
  description: "Art by Niko Alerce on Base and Ethereum — explore artworks and collections on Transient.",
};

export default function ArtOnEvmPage() {
  return <div className="pt-20"><TransientGallery /></div>;
}
