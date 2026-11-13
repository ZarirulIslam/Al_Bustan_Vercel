import type { Metadata } from "next";
import { Anek_Bangla, Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/data/settings";
import { getBaseUrl } from "@/lib/seo";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const bodyFont = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

// Bengali-only fallback for Bangla text (land/plot project pages,
// Bangla project names in the gallery…). Fraunces and Work Sans have no
// Bengali glyphs, so the browser falls through to this per character,
// for headings and body alike (see fontFamily in tailwind.config.ts).
// Anek Bangla is a modern, open sans with clear conjuncts and Bangla
// digits (১ ২ ৩…); it replaced Hind Siliguri, which read poorly at
// small sizes. Variable weight, so every weight costs one file. With
// only the "bengali" subset, Latin text keeps the brand fonts, and the
// file downloads only on pages that actually contain Bangla text.
const bengaliFont = Anek_Bangla({
  subsets: ["bengali"],
  variable: "--font-bn",
  preload: false,
});

// Async so the site's default title/description/OG tags reflect
// whatever is saved in /admin/settings, instead of a static value
// baked in at build time.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    // Lets canonical/OG-image metadata elsewhere in the app use a
    // site-relative path (e.g. "/projects/foo") instead of requiring
    // every caller to hand-build an absolute URL — Next resolves
    // relative URL-based metadata fields against this. Required as
    // soon as any page sets a relative `alternates.canonical`
    // (Project/BlogPost's canonicalUrl fallback does); omitting it
    // would be a build error for those pages.
    metadataBase: new URL(getBaseUrl()),
    title: {
      default: settings.seo.defaultTitle,
      template: `%s | ${settings.companyName}`,
    },
    description: settings.seo.defaultDescription,
    openGraph: {
      title: settings.seo.defaultTitle,
      description: settings.seo.defaultDescription,
      siteName: settings.companyName,
      type: "website",
    },
    // Set here rather than with app/icon.png-style files, which would
    // override this and leave the /admin/settings favicon with no effect.
    // The defaults live in public/ for when no favicon has been uploaded.
    // With an upload, every icon request goes through /favicon.ico (which
    // serves it); ?v= changes with each upload so browsers drop the old
    // cached icon.
    icons: settings.faviconUrl
      ? {
          icon: `/favicon.ico?v=${encodeURIComponent(settings.faviconUrl.split("/").pop()?.split(".")[0] ?? "1")}`,
          apple: settings.faviconUrl,
        }
      : {
          icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.png", type: "image/png", sizes: "32x32" }],
          apple: "/apple-icon.png",
        },
  };
}

// Intentionally minimal: this wraps EVERY route, including the admin
// section, which must not inherit the public Navbar/Footer. The
// public site's chrome lives in src/app/(site)/layout.tsx instead.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${displayFont.variable} ${bodyFont.variable} ${bengaliFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
