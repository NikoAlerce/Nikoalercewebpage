import type { Metadata } from "next";
import Support from "@/components/Support";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Support Niko Alerce — independent 3D artist from El Bolsón, Patagonia. Buy me a coffee or send XTZ / ETH.",
};

export default function SupportPage() {
  return (
    <main className="pt-24">
      <Support />
    </main>
  );
}
