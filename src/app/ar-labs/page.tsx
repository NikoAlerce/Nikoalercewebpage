import type { Metadata } from "next";
import ArLabs from "@/components/ArLabs";

export const metadata: Metadata = {
  title: "AR Labs",
  description:
    "AR Labs by Niko Alerce — augmented reality experiences for brands, events, art, retail and tourism. Scan a QR or printed marker and digital content comes alive over the real world. Services, capabilities and pricing.",
};

export default function ArLabsPage() {
  return (
    <div className="pt-20">
      <ArLabs />
    </div>
  );
}
