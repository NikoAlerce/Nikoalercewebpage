import type { Metadata } from "next";
import MetaverseEntry from "@/components/MetaverseEntry";

export const metadata: Metadata = {
  title: "3D Gallery",
  description:
    "Walk through Niko Alerce's first-person 3D gallery. View the live Tezos artworks on the walls and collect them on-chain.",
};

export default function MetaversePage() {
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden w-screen h-screen">
      <MetaverseEntry />
    </div>
  );
}
