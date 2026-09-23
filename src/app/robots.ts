import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin/private pages are also excluded via per-page `noindex`
      // meta (src/app/admin/layout.tsx) as defense-in-depth — a
      // robots.txt disallow alone stops crawling but doesn't
      // guarantee a URL is never indexed if it's linked elsewhere.
      disallow: ["/admin", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
