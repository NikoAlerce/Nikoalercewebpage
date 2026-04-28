import type { Metadata } from "next";
import Shop from "@/components/Shop";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Physical objects by Niko Alerce: prints, sculptures, and limited drops.",
};

export default function ShopPage() {
  return (
    <div className="pt-20">
      <Shop />
    </div>
  );
}
