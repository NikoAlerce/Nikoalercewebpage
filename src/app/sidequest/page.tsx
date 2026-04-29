import type { Metadata } from "next";
import NFTGallery from "@/components/NFTGallery";

export const metadata: Metadata = {
  title: "Side/Quest",
  description:
    "Niko Alerce's experimental alter ego. Iterations, drafts, and glitches.",
};

export default function SideQuestPage() {
  return (
    <div className="pt-20">
      <NFTGallery
        id="sidequest"
        alias="sidequest"
        title="SIDE/QUEST"
        subtitle="Experimental alter ego. Iterations, drafts, and glitches that do not fit the main canon."
        accent="jade"
      />
    </div>
  );
}
