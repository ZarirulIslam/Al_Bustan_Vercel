// The app's public origin (e.g. https://al-bustan-first.vercel.app), used
// as NEXTAUTH_URL and for absolute links (emails, sitemap, canonical).
// Plain .mjs so next.config.mjs can import it too.
//
// Hardened against the ways this env var goes wrong in practice:
//  - pasted with quotes, spaces, a trailing slash or a path
//  - a doubled/garbled scheme ("https://https://x", "https//x"), which
//    made NextAuth parse the host as "https" and fall back to its
//    built-in http://localhost:3000 default in production
//  - the local .env value (http://localhost:3000) copied into Vercel
// Order: a usable NEXTAUTH_URL → (on Vercel production) the project's
// production domain → this deployment's URL → http://localhost:3000.

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/** @returns {string | null} an origin like "https://example.com", or null if unusable */
export function normalizeOrigin(raw) {
  if (!raw) return null;
  let value = String(raw).trim().replace(/^["']+|["']+$/g, "").trim();
  // Strip every leading scheme-ish prefix: "https://", "https//", "http:/", repeated.
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

  let url = normalizeOrigin(env.NEXTAUTH_URL);
  // A localhost value on Vercel is always a copied .env — never right there.
  if (url && onVercel && isLocalOrigin(url)) url = null;

  if (!url && env.VERCEL_ENV === "production") url = normalizeOrigin(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (!url) url = normalizeOrigin(env.VERCEL_URL);
  return url ?? "http://localhost:3000";
}
