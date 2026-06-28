import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nikoalerce.art"),
  title: {
    default: "NIKO ALERCE // THE VOID",
    template: "%s — NIKO ALERCE",
  },
  description:
    "Niko Alerce — full-stack creative from El Bolsón, Patagonia. 3D art & animation, music production (El Bosquecito Records), Decentraland builds & wearables, and Tezos NFTs on Objkt.",
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
    title: "NIKO ALERCE // THE VOID",
    description:
      "3D art, glitch, and immersive web experiences. Live NFT gallery from Objkt.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@nikoalerce",
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/icon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mono.variable} ${display.variable}`}>
      <body className="bg-void text-bone scanlines crt-vignette">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
