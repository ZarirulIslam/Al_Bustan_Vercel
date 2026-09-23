import type { ReactNode } from "react";

// Small uppercase label used above section headings across the site
// — a lightweight echo of the small section tags used throughout the
// reference layouts ("Testimonial", "FAQ", "Featured Post"...).
export function Eyebrow({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.2em] ${
        tone === "light" ? "text-brass-light" : "text-brass-dark"
      }`}
    >
      {children}
    </p>
  );
}

// Pill-shaped variant for use directly on photos or dark, busy
// backgrounds where the plain text label would lose contrast —
// mirrors the small rounded tag badges in the reference design.
export function EyebrowPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brass-light backdrop-blur">
      {children}
    </span>
  );
}
