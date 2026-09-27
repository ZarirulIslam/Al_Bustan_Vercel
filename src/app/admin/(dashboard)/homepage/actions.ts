"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import {
  homepageSettingsFormSchema,
  type HomepageSettingsFormState,
} from "@/lib/admin/homepageSettingsSchema";

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("homepage");
}

function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/") || value.startsWith("/images/");
}

// The homepage reads settings + featured projects directly (no ISR
// caching beyond Next's request cache — see `revalidate = 0` on
// src/app/(site)/page.tsx), so revalidating "/" is what actually
// pushes a change live.
function revalidateHomepage() {
  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

export async function updateHomepageSettings(
  _prevState: HomepageSettingsFormState,
  formData: FormData
): Promise<HomepageSettingsFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = homepageSettingsFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: HomepageSettingsFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const fields = {
    heroTextEnabled: data.heroTextEnabled === "on",
    heroEyebrow: data.heroEyebrow,
    heroHeadline: data.heroHeadline,
    heroDescription: data.heroDescription,
    heroPrimaryButtonEnabled: data.heroPrimaryButtonEnabled === "on",
    heroPrimaryButtonLabel: data.heroPrimaryButtonLabel,
    heroPrimaryButtonUrl: data.heroPrimaryButtonUrl,
    heroSecondaryButtonEnabled: data.heroSecondaryButtonEnabled === "on",
    heroSecondaryButtonLabel: data.heroSecondaryButtonLabel,
    heroSecondaryButtonUrl: data.heroSecondaryButtonUrl,
    statsSectionEnabled: data.statsSectionEnabled === "on",
    ongoingStatLabel: data.ongoingStatLabel,
    ongoingStatEnabled: data.ongoingStatEnabled === "on",
    completedStatLabel: data.completedStatLabel,
    completedStatEnabled: data.completedStatEnabled === "on",
    upcomingStatLabel: data.upcomingStatLabel,
    upcomingStatEnabled: data.upcomingStatEnabled === "on",
    introSectionEnabled: data.introSectionEnabled === "on",
    whatWeDevelopSectionEnabled: data.whatWeDevelopSectionEnabled === "on",
    featuredProjectsSectionEnabled: data.featuredProjectsSectionEnabled === "on",
    valuePropsSectionEnabled: data.valuePropsSectionEnabled === "on",
    testimonialsSectionEnabled: data.testimonialsSectionEnabled === "on",
    teamSectionEnabled: data.teamSectionEnabled === "on",
    ctaSectionEnabled: data.ctaSectionEnabled === "on",
    blogSectionEnabled: data.blogSectionEnabled === "on",
    introHeading: data.introHeading,
    introBody: data.introBody,
  };

  const existing = await prisma.homepageSettings.findUnique({ where: { id: "singleton" } });

  const rawIntroImageUrl = String(formData.get("introImageUrl") || "");
  const newIntroImageUrl = isPlausibleImageUrl(rawIntroImageUrl) ? rawIntroImageUrl : undefined;

  await prisma.homepageSettings.upsert({
    where: { id: "singleton" },
    update: { ...fields, ...(newIntroImageUrl ? { introImageUrl: newIntroImageUrl } : {}) },
    create: { id: "singleton", ...fields, ...(newIntroImageUrl ? { introImageUrl: newIntroImageUrl } : {}) },
  });

  if (newIntroImageUrl && existing?.introImageUrl && existing.introImageUrl !== newIntroImageUrl) {
    await deleteImage(existing.introImageUrl);
  }

  await logActivity({
    action: "updated",
    resource: "HomepageSettings",
    description: "Updated homepage settings",
  });

  revalidateHomepage();
  return { success: true };
}

// Kept separate from the project's own `published` toggle (projects
// actions.ts) — featuring is a homepage-curation concern, editable
// only from /admin/homepage, so it can never be confused with a
// project's publish state.
export async function toggleFeaturedProject(id: string, featured: boolean) {
  await requireAdmin();
  const project = await prisma.project.update({ where: { id }, data: { featured } });
  await logActivity({
    action: "updated",
    resource: "Project",
    resourceId: id,
    description: `${featured ? "Featured" : "Unfeatured"} project "${project.name}" on the homepage`,
  });
  revalidateHomepage();
}
