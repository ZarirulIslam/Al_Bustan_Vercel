import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getEnabledRedirect } from "@/lib/redirects";

// Next.js 16 renamed middleware.ts to proxy.ts (and the exported
// function to `proxy`) — same request-interception role, just runs
// on the Node.js runtime by default instead of Edge. That's a
// non-issue here since getToken() (and, below, the Prisma-backed
// redirect lookup) only needs Node/Web-standard APIs, not anything
// Edge-specific.
//
// Location matters: Next detects this convention file relative to
// the `app` directory's parent, not the true project root — since
// `app` lives at src/app, this file must be at src/proxy.ts (a
// project-root proxy.ts is silently never discovered/bundled).
//
// Two unrelated concerns share this one file because Next only
// supports a single proxy.ts per project:
//   1. /admin/* auth guarding (original, unchanged below)
//   2. Admin-managed URL redirects (/admin/redirects) for every
//      other public path — see src/lib/redirects.ts for the lookup
//      and its caching trade-off.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const rule = await getEnabledRedirect(pathname);
  if (rule) {
    const status = rule.kind === "permanent" ? 301 : 302;
    return NextResponse.redirect(new URL(rule.toPath, request.url), status);
  }

  return NextResponse.next();
}

// Runs on every path except static assets, image optimization
// output, and the special SEO files — this necessarily includes
// every public page (not just /admin) now that redirects are
// checked here too, not only auth. /api is excluded: admin API
// routes enforce their own auth already (see src/app/api/admin/*),
// and redirects were never meant to apply there.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)"],
};
