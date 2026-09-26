// The app's public origin (e.g. https://www.example.com): the single
// source for NEXTAUTH_URL, emailed links, and SEO (canonical, sitemap,
// robots). Plain .mjs so next.config.mjs can import it too.
//
// Environment-driven only — no domain is hard-coded, so the same code
// runs locally, on Vercel, and on a VPS/custom domain. Resolution order:
//   1. APP_URL            — set this for a VPS / custom domain
//   2. NEXTAUTH_URL       — still honoured (existing setups)
//   3. On Vercel, automatically from Vercel's system variables:
//        production → VERCEL_PROJECT_PRODUCTION_URL (the project's
//                     production domain, custom or *.vercel.app)
//        preview    → VERCEL_BRANCH_URL / VERCEL_URL
//   4. Local development → http://localhost:<PORT or 3000>
//   5. Anything else (a production build/server with nothing configured)
//      fails loudly rather than silently pointing links at localhost.
//
// Values are cleaned up first (quotes, spaces, trailing slash/path, a
// doubled or garbled scheme like "https://https://x" — which made
// NextAuth fall back to http://localhost:3000 in production). On Vercel a
// localhost value is ignored as a copied local .env.

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/** @returns {string | null} an origin like "https://example.com", or null if unusable */
export function normalizeOrigin(raw) {
  if (!raw) return null;
  let value = String(raw).trim().replace(/^["']+|["']+$/g, "").trim();
  // Keep an explicit http:// only for local hosts; everything public is https.
  value = value.replace(/^(?:https?(?::\/{0,2}|\/{1,2}))+/i, "");
  if (!value) return null;
  const host = value.split(/[/?#]/)[0];
  if (!host) return null;
  const protocol = LOCAL_HOST.test(host) ? "http" : "https";
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

export function isLocalOrigin(origin) {
  try {
    return LOCAL_HOST.test(new URL(origin).host);
  } catch {
    return false;
  }
}

/** @param {Record<string, string | undefined>} env */
export function resolveAppUrl(env = process.env) {
  const onVercel = Boolean(env.VERCEL);
  const usable = (value) => {
    const origin = normalizeOrigin(value);
    // A localhost value on Vercel is always a copied .env — never right there.
    return origin && !(onVercel && isLocalOrigin(origin)) ? origin : null;
  };

  const configured = usable(env.APP_URL) ?? usable(env.NEXTAUTH_URL);
  if (configured) return configured;

  if (onVercel) {
    const vercel =
      env.VERCEL_ENV === "production"
        ? usable(env.VERCEL_PROJECT_PRODUCTION_URL) ?? usable(env.VERCEL_URL)
        : usable(env.VERCEL_BRANCH_URL) ?? usable(env.VERCEL_URL);
    if (vercel) return vercel;
  }

  if (env.NODE_ENV !== "production") return `http://localhost:${env.PORT || 3000}`;

  throw new Error(
    "APP_URL is not set. Set APP_URL (and NEXTAUTH_URL) to this site's public URL, e.g. https://www.example.com."
  );
}
