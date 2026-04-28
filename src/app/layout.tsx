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
    "3D and glitch visual artist. Digital pieces, Tezos NFTs via Objkt, and immersive experiences.",
  keywords: [
    "Niko Alerce",
    "sidequest",
    "3D art",
    "glitch",
    "NFT",
    "Tezos",
    "Objkt",
    "WebGL",
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
