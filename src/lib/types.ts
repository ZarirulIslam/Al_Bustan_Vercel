// Shared data shapes. These mirror the eventual database models so that
// pages built against this shape now can be wired to a real CMS/database
// later without changing component code.

export type ProjectStatus = "ongoing" | "completed" | "upcoming";

export interface ProjectImage {
  id: string;
  url: string;
  alt: string;
}

export type ProjectCategory = "land_plot" | "flat";

export interface Project {
  id: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  category: ProjectCategory;
  location: string;
  shortDescription: string;
  fullDescription: string;
  projectType: string;
  totalArea: string;
  unitInfo: string;
  timeline: string;
  // Rich text HTML — bulleted lists render as a check-mark grid.
  features: string;
  latitude: number | null;
  longitude: number | null;
  totalUnits: number | null;
  availableUnits: number | null;
  sizesOffered: string | null;
  pricingInfo: string | null;
  // Rich text HTML, like `features`.
  nearbyFacilities: string;
  brochureUrl: string | null;
  masterPlanUrl: string | null;
  bedroomOptions: string | null;
  block: string | null;
  facing: string | null;
  frontRoadWidth: string | null;
  coverImage: ProjectImage;
  gallery: ProjectImage[];
  published: boolean;
  featured: boolean;
  seoTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InventoryStatus = "available" | "reserved" | "sold";

// One sellable plot (land_plot projects) or flat/unit (flat
// projects) within a project. `code` is the plot number or unit
// number depending on the parent project's category; the
// category-specific fields are null for the other category.
export interface InventoryItem {
  id: string;
  projectId: string;
  code: string;
  size: string | null;
  facing: string | null;
  price: string | null;
  status: InventoryStatus;
  block: string | null;
  roadWidth: string | null;
  floor: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  parking: string | null;
  createdAt: string;
  updatedAt: string;
}

// A named payment option for a project (e.g. "Cash Payment", "3-Year
// Installment Plan"). Money/schedule fields are free text, same
// convention as InventoryItem.price. `enabled` hides a plan from the
// public project page without deleting it.
export interface PaymentPlan {
  id: string;
  projectId: string;
  name: string;
  bookingAmount: string | null;
  downPayment: string | null;
  installmentInfo: string | null;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// A single question/answer for a project's own FAQ section, distinct
// from the site-wide FAQ on the Contact page.
export interface ProjectFaq {
  id: string;
  projectId: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: ProjectImage;
  author: string;
  category: BlogCategory;
  published: boolean;
  publishedAt: string;
  seoTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
}

export type InquiryStatus = "new" | "contacted" | "follow_up" | "converted" | "closed";
export type InquiryType = "general" | "buying" | "site_visit" | "pricing" | "other";
export type LeadSource =
  | "website"
  | "referral"
  | "phone_call"
  | "walk_in"
  | "social_media"
  | "advertisement"
  | "other";
export type PropertyType = "land_plot" | "flat" | "commercial" | "other";

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  inquiryType: InquiryType;
  message: string;
  projectId: string | null;
  projectName: string | null;
  status: InquiryStatus;
  leadSource: LeadSource;
  propertyType: PropertyType | null;
  budget: string | null;
  customerNotes: string | null;
  followUpDate: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesEmployee {
  id: string;
  name: string;
  phone: string;
  email: string;
  designation: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  companyName: string;
  logoUrl: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  businessHours: string;
  messengerUrl: string | null;
  social: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
  };
  companyDescription: string;
  footerLegalText: string;
}

// Admin-editable parts of the homepage beyond the hero slider and
// featured projects — see src/lib/data/homepageSettings.ts and
// /admin/homepage.
export interface HomepageSettings {
  heroTextEnabled: boolean;
  heroEyebrow: string;
  heroHeadline: string;
  heroDescription: string;
  heroPrimaryButtonEnabled: boolean;
  heroPrimaryButtonLabel: string;
  heroPrimaryButtonUrl: string;
  heroSecondaryButtonEnabled: boolean;
  heroSecondaryButtonLabel: string;
  heroSecondaryButtonUrl: string;
  statsSectionEnabled: boolean;
  ongoingStatLabel: string;
  ongoingStatEnabled: boolean;
  completedStatLabel: string;
  completedStatEnabled: boolean;
  upcomingStatLabel: string;
  upcomingStatEnabled: boolean;
  introSectionEnabled: boolean;
  whatWeDevelopSectionEnabled: boolean;
  featuredProjectsSectionEnabled: boolean;
  valuePropsSectionEnabled: boolean;
  testimonialsSectionEnabled: boolean;
  teamSectionEnabled: boolean;
  ctaSectionEnabled: boolean;
  blogSectionEnabled: boolean;
  introHeading: string;
  introBody: string;
  introImageUrl: string;
}

// Which repeatable icon-card list a ContentItem belongs to — see
// prisma/schema.prisma's ContentItem model for the full explanation.
export type ContentSection =
  | "homepage_develop"
  | "homepage_value_prop"
  | "about_what_we_do"
  | "about_mission_points"
  | "about_core_values"
  | "about_approach_steps";

export type ContentTone = "garden" | "sky" | "brass";

export interface ContentItem {
  id: string;
  section: ContentSection;
  order: number;
  published: boolean;
  icon: string;
  tone: ContentTone;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Site-wide FAQ (Contact page) — distinct from ProjectFaq.
export interface SiteFaq {
  id: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// About page's admin-editable singleton text/photo content — see
// src/lib/data/aboutPageSettings.ts and /admin/about.
export interface AboutPageSettings {
  heroEyebrow: string;
  heroHeading: string;
  heroParagraph: string;
  heroImageUrl: string;
  overviewParagraph: string;
  overviewImageUrl: string;
  visionParagraph: string;
  portfolioParagraph: string;
  ctaHeading: string;
  teamSectionEnabled: boolean;
  // Leadership (Chairman / MD) message — all rich text HTML.
  leaderSectionEnabled: boolean;
  leaderHeading: string;
  leaderMessage: string;
  leaderName: string;
  leaderRole: string;
  leaderPhotoUrl: string | null;
}

// Public team/leadership member — see prisma/schema.prisma's TeamMember.
export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  // Rich text HTML (render with <RichText>).
  shortTitle: string;
  bio: string;
  photoUrl: string | null;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  photoUrl: string | null;
  designation: string | null;
  text: string;
  order: number;
  published: boolean;
  projectId: string | null;
  projectName: string | null;
  createdAt: string;
  updatedAt: string;
}

// A unified item for the public Gallery page — either a photo
// pulled live from a published project (source: "project") or a
// standalone image the admin added directly (source: "standalone").
export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  source: "project" | "standalone";
  projectSlug?: string;
  projectName?: string;
  caption?: string | null;
}

export type RedirectKind = "permanent" | "temporary";

export interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  kind: RedirectKind;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActivityAction = "created" | "updated" | "deleted" | "published" | "unpublished";

export interface ActivityLogEntry {
  id: string;
  adminUserId: string | null;
  adminEmail: string;
  action: ActivityAction;
  resource: string;
  resourceId: string | null;
  description: string;
  createdAt: string;
}

