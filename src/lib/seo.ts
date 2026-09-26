import { resolveAppUrl } from "@/lib/appUrl.mjs";

// Shared by robots.ts, sitemap.ts, the root layout's metadataBase,
// and any page building an absolute canonical/OG URL — previously
// this exact function body was copy-pasted independently in
// robots.ts and sitemap.ts. Mirrors the VERCEL_URL fallback already
// used for NEXTAUTH_URL in next.config.mjs, so all of these agree on
// the same base URL in a preview deployment with no env vars set.
export function getBaseUrl(): string {
  return resolveAppUrl(process.env);
}
