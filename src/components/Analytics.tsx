"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GoatCounter analytics (free, privacy-friendly, no cookie banner needed).
// Dashboard: https://nikoalerce.goatcounter.com
//
// count.js records the FIRST pageview on load, but this site navigates
// client-side (Next.js) without full reloads — so we also send a count on every
// route change (skipping the initial render, which the onload count covers).
// count.js ignores localhost by itself, so dev work never pollutes the stats.
// ─────────────────────────────────────────────────────────────────────────────

const GC_ENDPOINT = "https://nikoalerce.goatcounter.com/count";

declare global {
  interface Window {
    goatcounter?: { count?: (opts?: { path?: string }) => void };
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false; // first view is counted by count.js itself on load
      return;
    }
    window.goatcounter?.count?.({ path: pathname });
  }, [pathname]);

  return (
    <Script
      data-goatcounter={GC_ENDPOINT}
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
    />
  );
}
