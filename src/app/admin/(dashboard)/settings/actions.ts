"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import { settingsFormSchema, type SettingsFormState } from "@/lib/admin/settingsSchema";

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("settings");
}

function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/") || value.startsWith("/images/");
}

// Every page reads settings from the DB now (root layout metadata,
// the (site) layout for Navbar/Footer/floating widget, homepage,
// contact page) — revalidate all of them whenever settings change.
function revalidateEverythingSettingsTouch() {
  revalidatePath("/", "layout");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
}

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = settingsFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: SettingsFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.websiteSettings.findUnique({ where: { id: "singleton" } });

  const rawLogoUrl = String(formData.get("logoUrl") || "");
  const newLogoUrl = isPlausibleImageUrl(rawLogoUrl) ? rawLogoUrl : undefined;

  await prisma.websiteSettings.upsert({
    where: { id: "singleton" },
    update: {
      companyName: data.companyName,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      address: data.address,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      businessHours: data.businessHours,
      messengerUrl: data.messengerUrl || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      youtubeUrl: data.youtubeUrl || null,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      companyDescription: data.companyDescription,
      footerLegalText: data.footerLegalText,
      ...(newLogoUrl ? { logoUrl: newLogoUrl } : {}),
    },
    create: {
      id: "singleton",
      companyName: data.companyName,
      logoUrl: newLogoUrl ?? null,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      address: data.address,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      businessHours: data.businessHours,
      messengerUrl: data.messengerUrl || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      youtubeUrl: data.youtubeUrl || null,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      companyDescription: data.companyDescription,
      footerLegalText: data.footerLegalText,
    },
  });

  if (newLogoUrl && existing?.logoUrl && existing.logoUrl !== newLogoUrl) {
    await deleteImage(existing.logoUrl);
  }

  await logActivity({
    action: "updated",
    resource: "WebsiteSettings",
    description: "Updated website settings",
  });

  revalidateEverythingSettingsTouch();

  return { success: true };
}
