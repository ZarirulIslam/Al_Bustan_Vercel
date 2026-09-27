import type { AboutPageSettings, HomepageSettings, SiteSettings } from "./types";

// PLACEHOLDER — as of Phase 9, the real site settings live in the
// database (WebsiteSettings, managed at /admin/settings). This is
// now only the fallback used by src/lib/data/settings.ts if that
// table is empty (e.g. before the admin has saved settings, or a
// fresh database before seeding). Nothing here is real company
// information; every value is a clearly-labelled stand-in.
export const defaultSiteSettings: SiteSettings = {
  companyName: "Al Bustan Communities Limited",
  logoUrl: "/images/logo.png",
  phone: "+000 0000 0000",
  whatsapp: "https://wa.me/0000000000",
  email: "info@albustan-placeholder.com",
  address: "Address to be provided, City, Country",
  latitude: null,
  longitude: null,
  businessHours: "Sunday – Thursday, 9:00 AM – 6:00 PM",
  messengerUrl: null,
  social: {
    facebook: undefined,
    instagram: undefined,
    linkedin: undefined,
    youtube: undefined,
  },
  seo: {
    defaultTitle: "Al Bustan Communities Limited | Premium Real Estate",
    defaultDescription:
      "Al Bustan Communities Limited develops premium residential and mixed-use communities. Placeholder description — to be finalized with real company content.",
  },
  companyDescription:
    "Placeholder company description. Replace with Al Bustan Communities Limited's real positioning statement once provided.",
  footerLegalText: "Placeholder footer — legal links to be added.",
};

// PLACEHOLDER — mirrors defaultSiteSettings: the fallback used by
// src/lib/data/homepageSettings.ts if HomepageSettings hasn't been
// saved yet. Every section stays visible and every stat tile stays
// on with its default label, so the homepage looks exactly as it did
// before this admin control existed until the admin changes anything.
export const defaultHomepageSettings: HomepageSettings = {
  heroTextEnabled: true,
  heroEyebrow: "Al Bustan Communities Limited",
  heroHeadline: "Planned places to live, grow and invest",
  heroDescription:
    "We are a Dhaka-based real estate developer creating well-planned land, residential plots and apartments, built on clear information, careful planning and long-term value.",
  heroPrimaryButtonEnabled: true,
  heroPrimaryButtonLabel: "Explore Our Projects",
  heroPrimaryButtonUrl: "/projects",
  heroSecondaryButtonEnabled: true,
  heroSecondaryButtonLabel: "Talk to Our Team",
  heroSecondaryButtonUrl: "/contact",
  statsSectionEnabled: true,
  ongoingStatLabel: "Ongoing",
  ongoingStatEnabled: true,
  completedStatLabel: "Completed",
  completedStatEnabled: true,
  upcomingStatLabel: "Upcoming",
  upcomingStatEnabled: true,
  introSectionEnabled: true,
  whatWeDevelopSectionEnabled: true,
  featuredProjectsSectionEnabled: true,
  valuePropsSectionEnabled: true,
  testimonialsSectionEnabled: true,
  teamSectionEnabled: true,
  ctaSectionEnabled: true,
  blogSectionEnabled: true,
  introHeading: "A developer that plans for how families really live",
  introBody:
    "Al Bustan Communities Limited is a real estate development company based in Banani, Dhaka. We believe a good address is more than a piece of land or a set of walls. It is access, safety, community and space to grow. Every project we take on begins with a clear plan and honest information, so buyers can decide with confidence.",
  introImageUrl:
    "https://images.unsplash.com/photo-1758193431351-68538bf55ec3?auto=format&fit=crop&w=1400&q=80",
};

// PLACEHOLDER — mirrors the two above: the fallback used by
// src/lib/data/aboutPageSettings.ts if AboutPageSettings hasn't been
// saved yet, so the About page reads exactly as it did before this
// admin control existed until the admin changes anything.
export const defaultAboutPageSettings: AboutPageSettings = {
  heroEyebrow: "About Us",
  heroHeading: "Building better places to live and invest",
  heroParagraph:
    "Al Bustan Communities Limited is a real estate development company based in Banani, Dhaka. We plan and develop land, residential plots and apartments with a focus on careful planning, transparent information and long-term value.",
  heroImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=80",
  overviewParagraph:
    "Al Bustan Communities Limited was founded to bring clarity and careful planning to real estate in Bangladesh. We are a new company, and we intend to earn trust the way it is earned in this industry: by giving buyers clear information, planning each development around how people actually live, and staying in touch after the sale. Our portfolio will grow across land, plots and apartments. Our first project, Al Bustan Purbachal City, is underway in Rupganj, Narayanganj.",
  overviewImageUrl: "https://images.unsplash.com/photo-1768230130990-6b4fe57778ce?auto=format&fit=crop&w=1400&q=80",
  visionParagraph:
    "To be a trusted real estate developer known for well-planned places, honest communication and lasting value for the families and investors we serve.",
  portfolioParagraph:
    "Our first project is Al Bustan Purbachal City, an integrated community in Rupganj, Narayanganj.",
  ctaHeading: "Want to know more about our work?",
  teamSectionEnabled: true,
  leaderSectionEnabled: true,
  leaderHeading: "",
  leaderMessage: "",
  leaderName: "",
  leaderRole: "",
  leaderPhotoUrl: null,
};

// Fixed icon set offered in the admin's icon picker for ContentItem
// rows (What We Develop, Why Choose Al Bustan, Core Values). Kept
// small and generic-purpose rather than free-form upload, so every
// public page rendering an icon can do it with a simple inline SVG —
// no icon library, no user-uploaded SVGs to sanitize.
export const CONTENT_ICON_OPTIONS = [
  "home",
  "land",
  "grid",
  "building",
  "shield",
  "compass",
  "eye",
  "handshake",
  "users",
  "star",
] as const;

export type ContentIconKey = (typeof CONTENT_ICON_OPTIONS)[number];

export interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  {
    label: "Projects",
    href: "/projects",
    children: [
      { label: "Ongoing", href: "/projects/ongoing" },
      { label: "Completed", href: "/projects/completed" },
      { label: "Upcoming", href: "/projects/upcoming" },
    ],
  },
  { label: "Gallery", href: "/gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];
