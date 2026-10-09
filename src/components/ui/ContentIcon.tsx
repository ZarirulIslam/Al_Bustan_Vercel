import type { ReactNode } from "react";
import type { ContentIconKey } from "@/lib/constants";

// One small fixed icon set shared by every admin-editable icon-card
// list (What We Develop, Why Choose Al Bustan, Core Values, and each
// project's amenities/features/location sections) and by the admin's
// icon picker preview — see CONTENT_ICON_OPTIONS in src/lib/constants.ts.
// All icons are 24×24 line drawings with the same 1.6 stroke so any mix
// of them reads as one family.
const S = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS: Record<ContentIconKey, ReactNode> = {
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" {...S} />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" {...S} />
      <path d="M9.5 20v-6h5v6" {...S} />
    </>
  ),
  land: (
    <>
      <path d="M3 19h18M5 19V9l7-5 7 5v10" {...S} />
      <path d="M9 19v-6h6v6" {...S} />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" {...S} />
      <rect x="13" y="3.5" width="7.5" height="7.5" {...S} />
      <rect x="3.5" y="13" width="7.5" height="7.5" {...S} />
      <rect x="13" y="13" width="7.5" height="7.5" {...S} />
    </>
  ),
  building: (
    <>
      <path d="M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" {...S} />
      <path d="M13 21V10a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v11" {...S} />
      <path d="M8 8h1M8 12h1M8 16h1M3 21h18" {...S} />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" {...S} />
      <path d="m9 12 2.2 2.2L15.5 10" {...S} />
    </>
  ),
  compass: (
    <>
      <path d="M4 20V6a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" {...S} />
      <path d="M14 5v6h6M8 14h8M8 17.5h5" {...S} />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...S} />
      <circle cx="12" cy="12" r="2.6" {...S} />
    </>
  ),
  handshake: (
    <>
      <path d="M4 18v-1.5a3 3 0 0 1 3-3h1.5M20 18v-1.5a3 3 0 0 0-3-3h-1.5" {...S} />
      <circle cx="8.5" cy="8" r="2.75" {...S} />
      <circle cx="15.5" cy="8" r="2.75" {...S} />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" {...S} />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" {...S} />
      <path d="M16 8.5a2.6 2.6 0 1 0 0-5.2M15 13.2c2.4.4 4.4 1.9 5 3.9" {...S} />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8L12 3.5Z" {...S} />,
  pin: (
    <>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" {...S} />
      <circle cx="12" cy="9" r="2.5" {...S} />
    </>
  ),
  road: (
    <>
      <path d="M8 3 4 21M16 3l4 18" {...S} />
      <path d="M12 4v2.5M12 10.5v3M12 17.5V20" {...S} />
    </>
  ),
  plane: (
    <path
      d="M10.5 13.5 4 12l-1-1.5 1.5-.5 6 .5L15 5.5a1.8 1.8 0 0 1 2.6 2.5L13.5 12.5l.5 6-.5 1.5-1.5-1-1.5-6.5Z"
      {...S}
    />
  ),
  bus: (
    <>
      <rect x="4.5" y="3.5" width="15" height="14" rx="2" {...S} />
      <path d="M4.5 11h15M8 17.5V20M16 17.5V20" {...S} />
      <circle cx="8" cy="14.3" r=".6" {...S} />
      <circle cx="16" cy="14.3" r=".6" {...S} />
    </>
  ),
  car: (
    <>
      <path d="M4 16.5V12l2-5h12l2 5v4.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" {...S} />
      <path d="M4 12h16M7 17.5V19.5M17 17.5V19.5" {...S} />
      <circle cx="7.5" cy="14.5" r=".6" {...S} />
      <circle cx="16.5" cy="14.5" r=".6" {...S} />
    </>
  ),
  water: (
    <>
      <path d="M3 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" {...S} />
      <path d="M3 13c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" {...S} />
      <path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" {...S} />
    </>
  ),
  tree: (
    <>
      <path d="M12 3 6.5 10H9l-4 5.5h14L15 10h2.5L12 3Z" {...S} />
      <path d="M12 15.5V21" {...S} />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8.5 5-14 15-14 0 10-5.5 15-14 15" {...S} />
      <path d="M5 19c3-4.5 6-7 10-9" {...S} />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" {...S} />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" {...S} />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5a1 1 0 0 1 1-1h2.5L9 5h6l1.5 2.5H19a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5Z" {...S} />
      <circle cx="12" cy="13" r="3.2" {...S} />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" {...S} />
      <path d="M10 20.5a2 2 0 0 0 4 0" {...S} />
    </>
  ),
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" {...S} />,
  plug: (
    <>
      <path d="M9 3v4M15 3v4M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0V7Z" {...S} />
      <path d="M12 16v5" {...S} />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.7 16a5 5 0 0 1 6.6 0" {...S} />
      <circle cx="12" cy="19" r=".8" {...S} />
    </>
  ),
  recycle: (
    <>
      <path d="m7.5 9.5 3-5a1.7 1.7 0 0 1 3 0l2 3.3" {...S} />
      <path d="m17.5 14 2.2 3.6a1.7 1.7 0 0 1-1.5 2.6H13" {...S} />
      <path d="M9 20.2H5.8a1.7 1.7 0 0 1-1.5-2.6L6 14.8" {...S} />
      <path d="m13 6.5 2.5 1.3.3-2.8M15 22l-2-1.8 2-1.8M4.5 12.5 6 14.8l2.5-1.2" {...S} />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16" r="3.5" {...S} />
      <circle cx="18" cy="16" r="3.5" {...S} />
      <path d="M6 16 9.5 9h6L18 16M9.5 9 12 16h-6M14 6h2.5" {...S} />
    </>
  ),
  school: (
    <>
      <path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z" {...S} />
      <path d="M6.5 11v5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-5M21.5 9v5" {...S} />
    </>
  ),
  institution: (
    <>
      <path d="M3 9.5 12 4l9 5.5H3ZM4 20h16M3 21.5h18" {...S} />
      <path d="M6 12v5.5M10 12v5.5M14 12v5.5M18 12v5.5" {...S} />
    </>
  ),
  mosque: (
    <>
      <path d="M7 12c0-3 5-4.5 5-8 0 3.5 5 5 5 8" {...S} />
      <path d="M5.5 12h13v8.5h-13zM10 20.5v-3a2 2 0 0 1 4 0v3M3 20.5V9M21 20.5V9" {...S} />
    </>
  ),
  hospital: (
    <>
      <rect x="4" y="4" width="16" height="16.5" rx="1.5" {...S} />
      <path d="M12 8v6M9 11h6M10 20.5V17h4v3.5" {...S} />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5 5.5 4h13L20 9.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 9.5Z" {...S} />
      <path d="M5 11.5V20h14v-8.5M10 20v-4.5h4V20" {...S} />
    </>
  ),
  basket: (
    <>
      <path d="M3 10h18l-2 9.5a1 1 0 0 1-1 .8H6a1 1 0 0 1-1-.8L3 10Z" {...S} />
      <path d="m8 10 3-6M16 10l-3-6M9 14v3M15 14v3M12 14v3" {...S} />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v6a2 2 0 0 0 4 0V3M8 3v18" {...S} />
      <path d="M17 21V3c-2 1-3.5 3.5-3.5 7 0 1.5 1 2.5 3.5 2.5" {...S} />
    </>
  ),
  dumbbell: (
    <>
      <path d="M8 8v8M16 8v8M8 12h8" {...S} />
      <path d="M5 9.5v5M19 9.5v5M2.5 12H5M19 12h2.5" {...S} />
    </>
  ),
  pool: (
    <>
      <path d="M8 15V5.5A1.5 1.5 0 0 1 9.5 4M16 15V5.5A1.5 1.5 0 0 0 14.5 4M8 8h8M8 12h8" {...S} />
      <path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" {...S} />
    </>
  ),
  flame: (
    <path
      d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-4 3.5-5.5 4-10 3 2 4 4 4 6 1-.5 1.8-1.5 2-2.5 1.5 1.5 3 3.8 3 6.5 0 3.4-2.6 6-6.5 6Z"
      {...S}
    />
  ),
  sofa: (
    <>
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" {...S} />
      <path d="M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4ZM6 18v2M18 18v2" {...S} />
    </>
  ),
  child: (
    <>
      <circle cx="12" cy="12" r="8.5" {...S} />
      <path d="M8.8 14.2a4 4 0 0 0 6.4 0M9.5 10h.01M14.5 10h.01" {...S} />
    </>
  ),
  parking: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" {...S} />
      <path d="M9.5 17V7.5h3.3a2.8 2.8 0 0 1 0 5.6H9.5" {...S} />
    </>
  ),
  lift: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="1.5" {...S} />
      <path d="M12 3v18M7.5 10l1.5-2 1.5 2M13.5 14l1.5 2 1.5-2" {...S} />
    </>
  ),
  stairs: <path d="M3 20h5v-4.5h4.5V11H17V6.5h4" {...S} />,
  layers: (
    <>
      <path d="m12 3.5 9 5-9 5-9-5 9-5Z" {...S} />
      <path d="m3 12.5 9 5 9-5M3 16.5l9 5 9-5" {...S} />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="1" {...S} />
      <path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5" {...S} />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" {...S} />
      <path d="M3.5 10h17M8 3v4M16 3v4" {...S} />
    </>
  ),
};

export function ContentIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      {ICONS[icon as ContentIconKey] ?? ICONS.home}
    </svg>
  );
}
