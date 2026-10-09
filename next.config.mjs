/** @type {import('next').NextConfig} */
import { normalizeOrigin, resolveAppUrl } from "./src/lib/appUrl.mjs";

// NEXTAUTH_URL is inlined into the app at build time (next-auth's
// client module builds a URL object from it as soon as it's imported,
// and an unset/malformed value crashed `next build` with "Invalid URL").
// The value comes from src/lib/appUrl.mjs, which is environment-driven:
// APP_URL → NEXTAUTH_URL → Vercel's system URL → localhost (dev only).
// src/lib/auth.ts applies the same value at runtime for NextAuth's server.
const resolvedNextAuthUrl = resolveAppUrl(process.env);
for (const name of ["APP_URL", "NEXTAUTH_URL"]) {
  const raw = process.env[name];
  if (raw && normalizeOrigin(raw) !== resolvedNextAuthUrl) {
    console.warn(
      `[next.config] ${name}="${raw}" differs from the site URL in use (${resolvedNextAuthUrl}). Set APP_URL and NEXTAUTH_URL to the same public URL.`
    );
  }
}

const nextConfig = {
  env: {
    NEXTAUTH_URL: resolvedNextAuthUrl,
  },
  // Prisma 7's driver-adapter setup (src/lib/prisma.ts) pulls in
  // @prisma/client and pg's native Node bindings. Turbopack (Next
  // 16's default bundler) needs these kept out of its own bundling
  // pipeline and loaded as real Node modules instead, or server
  // builds fail to resolve the generated Prisma client at runtime.
  serverExternalPackages: ["@prisma/client", "pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Supabase Storage public URLs, e.g. https://<project-ref>.supabase.co/storage/v1/object/public/...
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        // YouTube video thumbnails (project video showcase).
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Admin forms no longer send image bytes through Server
      // Actions at all — cover/gallery/featured images are uploaded
      // directly from the browser to Supabase Storage
      // (src/lib/uploadClient.ts + src/app/api/admin/upload-url/),
      // and only the resulting URLs (plain text) are submitted here.
      // This limit only needs to comfortably cover form text fields
      // (long article content, many gallery URLs, etc.) — 2MB is
      // generous headroom for that and stays nowhere near Vercel's
      // ~4.5MB Serverless Function request-body ceiling.
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
