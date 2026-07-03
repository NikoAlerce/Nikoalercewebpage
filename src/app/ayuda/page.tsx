import type { Metadata } from "next";
import Support from "@/components/Support";

// Spanish-first share link for the emergency campaign (forces ES regardless of
// the visitor's language setting — meant for sharing in Argentine networks).
export const metadata: Metadata = {
  title: "Ayudanos",
  description:
    "Perdimos nuestra casa en un incendio — por segunda vez este año, y esta vez también a nuestras mascotas. Cualquier ayuda significa el mundo: café, PayPal, alias (Argentina), XTZ, ETH o BTC.",
  openGraph: {
    title: "Ayudanos a empezar de nuevo — Niko & Maru",
    description:
      "Perdimos nuestra casa en un incendio, por segunda vez este año. Cualquier ayuda significa el mundo.",
    images: ["/og-support.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-support.jpg"],
  },
};

export default function AyudaPage() {
  return (
    <main className="pt-24">
      <Support forceLang="es" />
    </main>
  );
}
