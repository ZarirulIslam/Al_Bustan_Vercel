// Section-level access control for plain admins. A Super Admin always
// has every section; an Admin only has the sections a Super Admin has
// ticked for them (AdminUser.permissions). Having a section means full
// use of it — viewing and editing.
//
// Enforced in three places, so hiding a link is never the only guard:
//  - src/proxy.ts blocks the section's pages (sectionForPath)
//  - each section's server actions call requireSectionAccess()
//    (src/lib/adminAuth.ts)
//  - the sidebar and dashboard only show what the admin can open
//
// Kept free of server-only imports so client components can use it.

export const ADMIN_SECTIONS = [
  { key: "homepage", label: "Homepage", group: "Content", path: "/admin/homepage" },
  { key: "hero", label: "Homepage Hero", group: "Content", path: "/admin/hero" },
  { key: "about", label: "About Page", group: "Content", path: "/admin/about" },
  { key: "projects", label: "Projects", group: "Content", path: "/admin/projects" },
  { key: "blog", label: "Blog", group: "Content", path: "/admin/blog" },
  { key: "gallery", label: "Gallery", group: "Content", path: "/admin/gallery" },
  { key: "testimonials", label: "Testimonials", group: "Content", path: "/admin/testimonials" },
  { key: "faqs", label: "FAQs", group: "Content", path: "/admin/faqs" },
  { key: "inquiries", label: "Leads & Inquiries", group: "Sales", path: "/admin/inquiries" },
  { key: "salesTeam", label: "Sales Team", group: "Sales", path: "/admin/sales-team" },
  { key: "redirects", label: "SEO Redirects", group: "System", path: "/admin/redirects" },
  { key: "activityLogs", label: "Activity Logs", group: "System", path: "/admin/activity-logs" },
  { key: "settings", label: "Website Settings", group: "System", path: "/admin/settings" },
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number]["key"];

const SECTION_KEYS = new Set<string>(ADMIN_SECTIONS.map((s) => s.key));

export function isAdminSection(value: string): value is AdminSection {
  return SECTION_KEYS.has(value);
}

export function sectionForPath(pathname: string): AdminSection | null {
  const match = ADMIN_SECTIONS.find((s) => pathname === s.path || pathname.startsWith(`${s.path}/`));
  return match?.key ?? null;
}

export function hasSectionAccess(
  user: { role?: string | null; permissions?: readonly string[] | null } | null | undefined,
  section: AdminSection
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.permissions?.includes(section) ?? false;
}

export function sectionLabel(key: string): string {
  return ADMIN_SECTIONS.find((s) => s.key === key)?.label ?? key;
}
