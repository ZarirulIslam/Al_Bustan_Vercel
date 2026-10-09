import type { Config } from "tailwindcss";

// Design tokens for Al Bustan Communities Limited.
// "Al Bustan" translates to "The Garden" — this pass deepens the
// palette into a premium, deep-green-led identity: a rich forest/
// emerald primary (think British-racing-green, not spring green),
// paired with an antique gold accent — the classic luxury-estate
// combination — plus a cooled, muted slate-teal for the "completed"
// status so the whole system reads as one considered jewel-tone
// family rather than a bright multi-color mix.
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C2321", // primary text / near-black, warm not pure black
          soft: "#3A4340",
        },
        garden: {
          50: "#EAF2EC",
          100: "#CFE4D6",
          300: "#6EA484",
          500: "#1C5B3E", // primary brand color — deep forest/emerald
          600: "#154A31", // hover
          700: "#0F3A26", // pressed / dark section fills
          900: "#081F14", // near-black green — footer, hero overlay
        },
        limestone: {
          DEFAULT: "#F4F2ED", // page background
          100: "#FAF9F6",
          200: "#EAE6DC", // secondary surface
          300: "#DCD5C6", // borders / dividers
        },
        // Antique gold — the premium accent paired with deep green.
        // Still keyed as "brass" so existing classes across the app
        // don't need renaming, but shifted from a bright marigold
        // orange into a muted metallic gold for a more refined,
        // jewelry-adjacent finish.
        brass: {
          50: "#F8F0DC",
          DEFAULT: "#8A6423", // sparing accent — CTAs, highlights, "upcoming" status
          light: "#C9A227",
          dark: "#5C430F",
        },
        // Slate-teal — cool accent standing in for open sky / water,
        // deepened and muted so it sits alongside the deep green and
        // gold instead of reading as a bright, unrelated blue.
        sky: {
          50: "#E8F0F1",
          DEFAULT: "#336E82", // "completed" status, secondary accents
          light: "#7FA8B5",
          dark: "#1B3E48",
        },
        white: "#FFFFFF",
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-bn)", "Georgia", "serif"],
        body: ["var(--font-body)", "var(--font-bn)", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        // Type scale, ~1.2 ratio, tuned for a display serif + body sans
        // pairing. Sizes were nudged up a step from the original pass —
        // body copy, card text, and metadata were reading too small,
        // especially on mobile — while keeping the same relative
        // hierarchy (each step still reads distinctly larger than the
        // last, nothing was flattened).
        xs: ["0.8125rem", { lineHeight: "1.55" }],
        sm: ["0.9375rem", { lineHeight: "1.6" }],
        base: ["1.0625rem", { lineHeight: "1.7" }],
        lg: ["1.1875rem", { lineHeight: "1.65" }],
        xl: ["1.4375rem", { lineHeight: "1.5" }],
        "2xl": ["1.8125rem", { lineHeight: "1.3" }],
        "3xl": ["2.375rem", { lineHeight: "1.2" }],
        "4xl": ["3rem", { lineHeight: "1.12" }],
        "5xl": ["3.875rem", { lineHeight: "1.05" }],
        "6xl": ["4.875rem", { lineHeight: "1.02" }],
      },
      maxWidth: {
        content: "1240px",
        prose: "68ch",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        // Green-tinted rather than neutral black shadows, so elevation
        // itself carries a trace of the brand color — a subtle but
        // consistent premium cue across cards, buttons and dropdowns.
        card: "0 1px 2px rgba(8, 31, 20, 0.08), 0 8px 24px -12px rgba(8, 31, 20, 0.18)",
        "card-hover": "0 4px 12px rgba(8, 31, 20, 0.10), 0 20px 40px -14px rgba(8, 31, 20, 0.26)",
      },
      transitionTimingFunction: {
        estate: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
