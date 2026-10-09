import type { Metadata } from "next";
import { Fraunces, Hind_Siliguri, Work_Sans } from "next/font/google";
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

// Bengali-only fallback for the Bangla land/plot project pages. Fraunces
// and Work Sans have no Bengali glyphs, so the browser falls through to
// this per character, for headings and body alike (see fontFamily in
// tailwind.config.ts). Hind Siliguri is a plain, highly legible sans —
// its Bangla digits (১ ২ ৩…) read clearly at every size, unlike the serif
// Bengali face used before. With only the "bengali" subset, Latin text
// keeps the brand fonts, and the files download only on pages that
// actually contain Bangla text.
const bengaliFont = Hind_Siliguri({
  subsets: ["bengali"],
  variable: "--font-bn",
  weight: ["400", "500", "600", "700"],
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
