import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "3D Gallery",
  description:
    "Walk through Niko Alerce's first-person 3D gallery. View the live Tezos artworks on the walls and collect them on-chain.",
};

const MetaverseGallery = dynamic(
  () => import("@/components/MetaverseGallery"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black flex flex-col justify-center items-center select-none font-mono">
        <div className="text-[10px] tracking-[0.6em] text-cyan-400 animate-pulse mb-4">
          BOOTING_UP_3D_GALLERY_ENGINE...
        </div>
        <div className="w-48 h-px bg-white/10 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-cyan-400 w-1/3 animate-[marquee_1.5s_infinite_linear]" />
        </div>
      </div>
    ),
  }
);

export default function MetaversePage() {
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden w-screen h-screen">
      <MetaverseGallery />
    </div>
  );
}
