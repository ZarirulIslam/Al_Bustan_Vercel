"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import {
  aboutPageSettingsFormSchema,
  type AboutPageSettingsFormState,
} from "@/lib/admin/aboutPageSettingsSchema";

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("about");
}

function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/") || value.startsWith("/images/");
}

function revalidateAboutPage() {
  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function updateAboutPageSettings(
  _prevState: AboutPageSettingsFormState,
  formData: FormData
): Promise<AboutPageSettingsFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = aboutPageSettingsFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: AboutPageSettingsFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.aboutPageSettings.findUnique({ where: { id: "singleton" } });

  const rawHeroImageUrl = String(formData.get("heroImageUrl") || "");
  const newHeroImageUrl = isPlausibleImageUrl(rawHeroImageUrl) ? rawHeroImageUrl : undefined;
  const rawOverviewImageUrl = String(formData.get("overviewImageUrl") || "");
  const newOverviewImageUrl = isPlausibleImageUrl(rawOverviewImageUrl) ? rawOverviewImageUrl : undefined;

  const fields = {
    heroEyebrow: data.heroEyebrow,
    heroHeading: data.heroHeading,
    heroParagraph: data.heroParagraph,
    overviewParagraph: data.overviewParagraph,
    visionParagraph: data.visionParagraph,
    portfolioParagraph: data.portfolioParagraph,
    ctaHeading: data.ctaHeading,
    ...(newHeroImageUrl ? { heroImageUrl: newHeroImageUrl } : {}),
    ...(newOverviewImageUrl ? { overviewImageUrl: newOverviewImageUrl } : {}),
  };

  await prisma.aboutPageSettings.upsert({
    where: { id: "singleton" },
    update: fields,
    create: { id: "singleton", ...fields },
  });

  if (newHeroImageUrl && existing?.heroImageUrl && existing.heroImageUrl !== newHeroImageUrl) {
    await deleteImage(existing.heroImageUrl);
  }
  if (newOverviewImageUrl && existing?.overviewImageUrl && existing.overviewImageUrl !== newOverviewImageUrl) {
    await deleteImage(existing.overviewImageUrl);
  }

  await logActivity({
    action: "updated",
    resource: "AboutPageSettings",
    description: "Updated About page settings",
  });

  revalidateAboutPage();
  return { success: true };
}
