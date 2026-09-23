import type { Metadata } from "next";
import type { ReactNode } from "react";

// Wraps the entire /admin subtree (both the login page and the
// authenticated dashboard) purely to set metadata — no markup, no
// auth logic (that stays in (dashboard)/layout.tsx + proxy.ts).
// robots.txt already disallows /admin, but that alone only stops
// crawling; it doesn't guarantee a URL already indexed elsewhere
// gets dropped. This per-page noindex is the actual guarantee.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
