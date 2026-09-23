import { prisma } from "@/lib/prisma";

interface RedirectRule {
  toPath: string;
  kind: "permanent" | "temporary";
}

// Used by proxy.ts, which runs on (close to) every public request —
// per Next's own Proxy docs, Proxy "is not intended for slow data
// fetching", so this avoids a Postgres round trip per request by
// loading the (small, admin-managed) enabled-redirects list once and
// reusing it for CACHE_TTL_MS. A newly created/edited/deleted
// redirect can take up to that long to take effect on a given server
// instance — an acceptable trade-off for a low-traffic site's
// occasional URL redirects, and far cheaper than a full data-cache
// layer. Proxy's own docs caution against relying on shared
// module-level state for correctness in the general case (a redirect
// could in principle run somewhere this module was never loaded) —
// noted here deliberately rather than treated as a solved problem.
const CACHE_TTL_MS = 60_000;

let cache: Map<string, RedirectRule> | null = null;
let cacheLoadedAt = 0;

async function loadEnabledRedirects(): Promise<Map<string, RedirectRule>> {
  const rows = await prisma.redirect.findMany({
    where: { enabled: true },
    select: { fromPath: true, toPath: true, kind: true },
  });
  const map = new Map<string, RedirectRule>();
  for (const row of rows) {
    map.set(row.fromPath, { toPath: row.toPath, kind: row.kind });
  }
  return map;
}

export async function getEnabledRedirect(pathname: string): Promise<RedirectRule | null> {
  const now = Date.now();
  if (!cache || now - cacheLoadedAt > CACHE_TTL_MS) {
    cache = await loadEnabledRedirects();
    cacheLoadedAt = now;
  }
  return cache.get(pathname) ?? null;
}
