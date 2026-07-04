import { NextResponse, type NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// First-visit language by IP. On Vercel every request carries the visitor's
// country in `x-vercel-ip-country`; if they haven't chosen a language yet (no
// `nk_lang` cookie), we set it from that country — Spanish for Spanish-speaking
// countries, English otherwise. The in-page switch overwrites the cookie, so a
// manual choice always wins and this never runs against it again.
// (Locally there's no geo header, so the cookie stays unset and the client falls
// back to the browser language — see src/lib/i18n.tsx.)
// ─────────────────────────────────────────────────────────────────────────────

const ES_COUNTRIES = new Set([
  "AR", "ES", "MX", "CL", "UY", "PE", "CO", "BO", "PY", "EC",
  "VE", "GT", "CR", "PA", "DO", "HN", "NI", "SV", "CU", "PR",
]);

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get("nk_lang")) {
    const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
    if (country) {
      res.cookies.set("nk_lang", ES_COUNTRIES.has(country) ? "es" : "en", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }
  return res;
}

export const config = {
  // Run on pages only — skip Next internals, API routes and static files.
  matcher: ["/((?!_next|api|.*\\.).*)"],
};
