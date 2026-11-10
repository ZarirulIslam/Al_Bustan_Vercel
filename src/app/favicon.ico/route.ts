import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSiteSettings } from "@/lib/data/settings";

// /favicon.ico serves the favicon uploaded in /admin/settings. Browsers,
// bookmarks and search engines ask for /favicon.ico directly, whatever
// the page's <link rel="icon"> says, so a static file here would keep
// showing the old icon. Falls back to the built-in icon when none has
// been uploaded (or the upload can't be fetched).
export const dynamic = "force-dynamic";

// Short browser cache, longer CDN cache: a new upload shows up within
// minutes without every visit hitting storage.
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

async function fallback() {
  const file = await readFile(path.join(process.cwd(), "public", "default-favicon.ico"));
  return new Response(new Uint8Array(file), {
    headers: { "Content-Type": "image/x-icon", "Cache-Control": CACHE },
  });
}

export async function GET() {
  const { faviconUrl } = await getSiteSettings();
  if (!faviconUrl) return fallback();

  try {
    // Local-storage uploads are saved as site paths ("/uploads/…").
    if (faviconUrl.startsWith("/")) {
      // Only files under public/uploads — never anything outside it.
      const uploads = path.join(process.cwd(), "public", "uploads");
      const target = path.join(process.cwd(), "public", decodeURIComponent(faviconUrl.split("?")[0]));
      if (!target.startsWith(uploads + path.sep)) return fallback();
      const file = await readFile(target);
      const ext = path.extname(faviconUrl).toLowerCase();
      const type = ext === ".ico" ? "image/x-icon" : ext === ".svg" ? "image/svg+xml" : `image/${ext.slice(1) || "png"}`;
      return new Response(new Uint8Array(file), { headers: { "Content-Type": type, "Cache-Control": CACHE } });
    }
    const upstream = await fetch(faviconUrl, { cache: "no-store" });
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !type.startsWith("image/")) return fallback();
    return new Response(await upstream.arrayBuffer(), {
      headers: { "Content-Type": type, "Cache-Control": CACHE },
    });
  } catch {
    return fallback();
  }
}
