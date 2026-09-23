/** @type {import('next').NextConfig} */

// NextAuth's client module reads NEXTAUTH_URL and constructs a URL
// object the moment it's imported — including during `next build`'s
// module-loading pass, which happens for every page regardless of
// static/dynamic rendering. If NEXTAUTH_URL is unset (e.g. not yet
// added in Vercel's dashboard), that crashes the entire build with
// "TypeError: Invalid URL". Vercel always provides VERCEL_URL for
// every deployment with no configuration needed, so use that as a
// guaranteed fallback — this makes the build resilient to a missing
// env var instead of depending on it being configured correctly.
// An explicitly-set NEXTAUTH_URL (e.g. the final custom domain) still
// always wins.
const resolvedNextAuthUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

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
