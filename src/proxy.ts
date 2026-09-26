import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveAppUrl } from "@/lib/appUrl.mjs";
import { getEnabledRedirect } from "@/lib/redirects";
import { prisma } from "@/lib/prisma";
import { hasSectionAccess, sectionForPath } from "@/lib/admin/permissions";

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
// Admin pages reachable while signed out: login, the forgot/reset-
// password flow, and the emailed invite/email-confirmation links. The
// token in the link is what authorizes those, not a session.
const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/accept-invite",
  "/admin/verify-email",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // Must match authOptions.useSecureCookies (src/lib/auth.ts).
      secureCookie: resolveAppUrl(process.env).startsWith("https://"),
    });

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role / section access for the page itself, read fresh from the
    // database (the JWT cookie can be up to a session old). This runs
    // for full page loads, client navigations and server-action POSTs
    // alike; server actions additionally check on their own, since
    // they can be invoked from any page.
    const section = sectionForPath(pathname);
    const superAdminOnly = pathname === "/admin/users" || pathname.startsWith("/admin/users/");
    if (section || superAdminOnly) {
      const admin = token.id
        ? await prisma.adminUser.findUnique({
            where: { id: token.id },
            select: { role: true, permissions: true, isActive: true },
          })
        : null;
      if (!admin?.isActive) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      const allowed = superAdminOnly ? admin.role === "super_admin" : hasSectionAccess(admin, section!);
      if (!allowed) {
        const home = new URL("/admin", request.url);
        home.searchParams.set("denied", section ?? "users");
        return NextResponse.redirect(home);
      }
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
