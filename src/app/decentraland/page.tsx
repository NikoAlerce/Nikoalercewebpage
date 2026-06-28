import type { Metadata } from "next";
import Decentraland from "@/components/Decentraland";

export const metadata: Metadata = {
  title: "Decentraland",
  description:
    "Hire Niko Alerce for Decentraland — builds, wearables and emotes. Verified work for AMAIXEN and ohde. Interactive 3D showcase, rates and availability.",
};

export default function DecentralandPage() {
  return (
    <div className="pt-20">
      <Decentraland />
    </div>
  );
}
