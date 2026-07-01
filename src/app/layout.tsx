import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/AppShell";

// Throwup (W Type Foundry) — graffiti "throw-up" face for the big display titles.
// We use the monochrome "Fill" layer so it can be recolored to the brand palette.
// NOTE: the bundled license is *personal use* — secure the commercial license
// from W Type Foundry before deploying this publicly.
const graffiti = localFont({
  src: "../../public/fonts/throwup-fill.otf",
  variable: "--font-graffiti",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Clean modern grotesque for everything that isn't a throwup title — secondary headings
// AND body. One contemporary sans, no serif (pairs with the graffiti display for a
// streetwear/editorial feel). Drives both --font-sans and --font-display.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nikoalerce.art"),
  title: {
    default: "Niko Alerce — 3D Artist, Animator & Music Producer",
    template: "%s — Niko Alerce",
  },
  description:
    "Niko Alerce — multidisciplinary artist from El Bolsón, Patagonia. 3D art & animation, video, music production (El Bosquecito Records), Decentraland builds & wearables, and Tezos NFTs on Objkt.",
  keywords: [
    "Niko Alerce",
    "3D artist",
    "music producer",
    "El Bosquecito Records",
    "Decentraland",
    "metaverse",
    "Blender",
    "NFT",
    "Tezos",
    "Objkt",
    "El Bolsón",
    "Patagonia",
  ],
  openGraph: {
    title: "Niko Alerce — 3D Artist, Animator & Music Producer",
    description:
      "3D art, animation, video and immersive worlds. Live NFT gallery from Objkt.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@nikoalerce",
  },
  // icon.png / apple-icon.png / opengraph-image.png in src/app/ are Next's file-convention
  // metadata images — it wires up the <link>/<meta> tags for these automatically, no
  // `icons`/`openGraph.images` entries needed here.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mono.variable} ${grotesk.variable} ${graffiti.variable}`}>
      <body className="bg-void text-bone antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
