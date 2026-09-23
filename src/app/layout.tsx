import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
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
  weight: ["400", "500", "600"],
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
    <html lang="en" data-scroll-behavior="smooth" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
