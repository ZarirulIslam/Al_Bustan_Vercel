import type { ContentIconKey } from "@/lib/constants";

// One small fixed icon set shared by every admin-editable icon-card
// list (What We Develop, Why Choose Al Bustan, Core Values) and by
// the admin's icon picker preview — see CONTENT_ICON_OPTIONS in
// src/lib/constants.ts.
export function ContentIcon({ icon, className }: { icon: string; className?: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    className,
  } as const;

  switch (icon as ContentIconKey) {
    case "land":
      return (
        <svg {...common}>
          <path d="M3 19h18M5 19V9l7-5 7 5v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 19v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="3.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3.5" y="13" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="13" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <path d="M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M13 21V10a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 8h1M8 12h1M8 16h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="m9 12 2.2 2.2L15.5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <path
            d="M4 20V6a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M14 5v6h6M8 14h8M8 17.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path
            d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...common}>
          <path
            d="M4 18v-1.5a3 3 0 0 1 3-3h1.5M20 18v-1.5a3 3 0 0 0-3-3h-1.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="8.5" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="15.5" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M16 8.5a2.6 2.6 0 1 0 0-5.2M15 13.2c2.4.4 4.4 1.9 5 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path
            d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "home":
    default:
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9.5 20v-6h5v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
  }
}
