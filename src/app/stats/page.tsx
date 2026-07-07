import type { Metadata } from "next";
import StatsDashboard from "@/components/StatsDashboard";

// Private analytics view. Unlisted in the nav and kept out of search engines —
// access is gated by a password inside the dashboard (see /api/stats).
export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default function StatsPage() {
  return (
    <main className="pt-24">
      <StatsDashboard />
    </main>
  );
}
