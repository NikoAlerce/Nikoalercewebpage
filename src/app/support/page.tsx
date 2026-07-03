import type { Metadata } from "next";
import Support from "@/components/Support";

export const metadata: Metadata = {
  title: "Support",
  description:
    "We lost our home to a fire — twice this year, and this time our pets too. Any help means the world: coffee, PayPal, bank alias (Argentina), XTZ, ETH or BTC.",
  openGraph: {
    title: "Help us start again — Niko & Maru",
    description:
      "We lost our home to a fire, for the second time this year. Any help means the world.",
    images: ["/og-support.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-support.jpg"],
  },
};

export default function SupportPage() {
  return (
    <main className="pt-24">
      <Support />
    </main>
  );
}
