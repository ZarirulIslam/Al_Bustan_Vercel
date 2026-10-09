import type { ProjectCategory, ProjectItemSection } from "@/lib/types";

// Admin-facing description of each repeatable block on a project's
// detail page (ProjectSectionItem.section). The Land/Plot (Bangla) and
// Flat/Apartment (English) pages are laid out differently (see
// src/components/project/), so each section says which project types
// use it. The form shows an image upload per `image`, the icon picker
// per `icon`, and a tab select when `tabs` is set; `titleLabel` /
// `descriptionLabel` rename the two text fields where they mean
// something else (e.g. a stat's value and label). `hint` names where the
// items appear — by the page's own (Bangla) heading for land projects.
export interface ProjectSectionConfig {
  label: string;
  hint: string;
  categories: ProjectCategory[];
  icon: boolean;
  image: "none" | "optional" | "required";
  description: boolean;
  example: string;
  titleLabel?: string;
  descriptionLabel?: string;
  tabs?: { value: string; label: string }[];
}

export const PLOT_TABS = [
  { value: "residential", label: "আবাসিক প্লট" },
  { value: "commercial", label: "বাণিজ্যিক প্লট" },
];

export const PROJECT_SECTIONS: Record<ProjectItemSection, ProjectSectionConfig> = {
  stat: {
    label: "Intro figures",
    hint: "The three figures under “প্রকল্প পরিচিতি” — e.g. 600+ / একর টাউনশিপ, 2021 / প্রতিষ্ঠিত, RAJUK / অনুমোদিত লেআউট.",
    categories: ["land_plot"],
    icon: false,
    image: "none",
    description: true,
    example: "e.g. 600+",
    titleLabel: "Value",
    descriptionLabel: "Label",
  },
  location_highlight: {
    label: "Connectivity cards",
    hint: "Cards under the video in the location section (they scroll past the fixed text) — e.g. বিমানবন্দর ও ৩০০ ফিট সড়ক.",
    categories: ["land_plot"],
    icon: true,
    image: "none",
    description: true,
    example: "e.g. বিমানবন্দর ও ৩০০ ফিট সড়ক",
  },
  key_feature: {
    label: "Features",
    hint: "“…বৈশিষ্ট্যসমূহ” — icon list beside the photo carousel. E.g. রাজউক অনুমোদন ও নীতিমালা.",
    categories: ["land_plot"],
    icon: true,
    image: "none",
    description: true,
    example: "e.g. রাজউক অনুমোদন ও নীতিমালা",
  },
  plot_type: {
    label: "Plot types",
    hint: "“উপলব্ধ প্লটসমূহ” — cards grouped under the আবাসিক / বাণিজ্যিক tabs.",
    categories: ["land_plot"],
    icon: true,
    image: "none",
    description: true,
    example: "e.g. ৩-৫ কাঠা প্লট",
    tabs: PLOT_TABS,
  },
  goal: {
    label: "Goals",
    hint: "“…লক্ষ্য” — numbered photo cards (01, 02…) that scroll past the fixed text. Each needs a photo.",
    categories: ["land_plot"],
    icon: false,
    image: "required",
    description: false,
    example: "e.g. আধুনিক নগর পরিকল্পনার মানদণ্ড অনুযায়ী একটি পরিকল্পিত টাউনশিপ গড়ে তোলা।",
  },
  route: {
    label: "Map routes",
    hint: "“…লোকেশন ম্যাপ” — routes and landmarks listed beside the master plan. E.g. কুড়িল ফ্লাইওভার.",
    categories: ["land_plot"],
    icon: true,
    image: "none",
    description: true,
    example: "e.g. কুড়িল ফ্লাইওভার",
  },
  security: {
    label: "Security",
    hint: "“সর্বোচ্চ সুরক্ষিত জোন” — icon tiles, e.g. সিসিটিভি নজরদারি.",
    categories: ["land_plot"],
    icon: true,
    image: "none",
    description: false,
    example: "e.g. সিসিটিভি নজরদারি",
  },
  amenity: {
    label: "Amenities",
    hint: "Icon tiles of facilities — on land pages under “সকল সুযোগ-সুবিধার সমাহার” (e.g. স্কুল, পার্ক), on apartment pages under “Features & Amenities”.",
    categories: ["land_plot", "flat"],
    icon: true,
    image: "none",
    description: false,
    example: "e.g. স্কুল / Gymnasium",
  },
  partner: {
    label: "Sister concerns",
    hint: "“আমাদের অঙ্গপ্রতিষ্ঠান” — one logo per company.",
    categories: ["land_plot"],
    icon: false,
    image: "required",
    description: false,
    example: "e.g. Company name",
    titleLabel: "Company name",
  },
  floor_plan: {
    label: "Floor Plans",
    hint: "Key plan drawings, one per floor type. Visitors switch between them with tabs.",
    categories: ["flat"],
    icon: false,
    image: "required",
    description: true,
    example: "e.g. Typical Floor",
  },
  // No longer shown on any page; kept so existing rows still load.
  investment_reason: {
    label: "Investment reasons",
    hint: "Not shown on the current pages.",
    categories: [],
    icon: false,
    image: "none",
    description: true,
    example: "",
  },
};

// Gallery filter tabs — each layout has its own set. Images without a
// category only show under "All". Keys are unique across both sets
// ("surroundings" is shared), so a stored key always resolves.
export const LAND_GALLERY_CATEGORIES = [
  { value: "overview", en: "Project Overview", bn: "প্রকল্প পরিচিতি" },
  { value: "progress", en: "Development Progress", bn: "উন্নয়ন অগ্রগতি" },
  { value: "infrastructure", en: "Road & Infrastructure", bn: "রাস্তা ও অবকাঠামো" },
  { value: "green", en: "Green Space", bn: "সবুজ পরিবেশ" },
  { value: "community", en: "Community", bn: "কমিউনিটি" },
  { value: "events", en: "Events", bn: "ইভেন্ট" },
  { value: "surroundings", en: "Surroundings", bn: "আশপাশের এলাকা" },
  { value: "future", en: "Future Development", bn: "ভবিষ্যৎ উন্নয়ন" },
] as const;

export const APARTMENT_GALLERY_CATEGORIES = [
  { value: "exterior", en: "Exterior", bn: "বাহ্যিক" },
  { value: "interior", en: "Interior", bn: "অভ্যন্তর" },
  { value: "living_room", en: "Living Room", bn: "লিভিং রুম" },
  { value: "bedroom", en: "Bedroom", bn: "বেডরুম" },
  { value: "kitchen", en: "Kitchen", bn: "কিচেন" },
  { value: "amenities", en: "Amenities", bn: "সুবিধাসমূহ" },
  { value: "construction", en: "Construction Progress", bn: "নির্মাণ অগ্রগতি" },
  { value: "surroundings", en: "Surroundings", bn: "আশপাশের এলাকা" },
] as const;

export type GalleryCategoryOption = { value: string; en: string; bn: string };

export function galleryCategoriesFor(category: ProjectCategory): readonly GalleryCategoryOption[] {
  return category === "flat" ? APARTMENT_GALLERY_CATEGORIES : LAND_GALLERY_CATEGORIES;
}

// Both sets, de-duplicated by key — used to validate and label stored values.
export const ALL_GALLERY_CATEGORIES: readonly GalleryCategoryOption[] = [
  ...LAND_GALLERY_CATEGORIES,
  ...APARTMENT_GALLERY_CATEGORIES.filter((a) => !LAND_GALLERY_CATEGORIES.some((l) => l.value === a.value)),
];

export function isGalleryCategory(value: string): boolean {
  return ALL_GALLERY_CATEGORIES.some((c) => c.value === value);
}

// YouTube URL (watch, youtu.be, shorts, embed) → video id, or null for
// anything else, so a pasted link in any common form just works.
export function youtubeId(url: string): string | null {
  const match = url
    .trim()
    .match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Admin area for each project type — Land and Apartment projects are
// managed in separate sections of the CMS (see /admin/projects/land and
// /admin/projects/apartments), each with an editor shaped like its page.
export function projectAdminBase(category: ProjectCategory): string {
  return category === "flat" ? "/admin/projects/apartments" : "/admin/projects/land";
}

export function projectEditPath(project: { id: string; category: ProjectCategory }): string {
  return `${projectAdminBase(project.category)}/${project.id}/edit`;
}
