import type { Metadata } from "next";
import Support from "@/components/Support";

export const metadata: Metadata = {
  title: "Support",
  description:
    "We lost our home to a fire — twice this year, and this time our pets too. Any help means the world: coffee, PayPal, bank alias (Argentina), XTZ, ETH or BTC.",
  // og:image / twitter:image come from the route-level opengraph-image.jpg &
  // twitter-image.jpg files (the burning-house card) — that reliably overrides the
  // site-wide default avatar image for this route.
  openGraph: {
    title: "Help us start again — Niko & Maru",
    description:
      "We lost our home to a fire, for the second time this year. Any help means the world.",
  },
};

export default function SupportPage() {
  return (
    <main className="pt-24">
      <Support />
    </main>
  );
}
