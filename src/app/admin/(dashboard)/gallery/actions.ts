"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("gallery");
}

function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/");
}

const MAX_CAPTION_LENGTH = 300;

function revalidateGalleryPages() {
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
}

// Images are uploaded client-side first (same direct-to-Supabase flow
// as everywhere else — see src/lib/uploadClient.ts), so this action
// just receives the resulting URLs and creates the records.
export async function addGalleryImages(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const urls = formData.getAll("imageUrls").map(String).filter(isPlausibleImageUrl);
  const rawCaption = String(formData.get("caption") || "").trim();

  if (urls.length === 0) {
    return { error: "Add at least one photo before saving — please wait for uploads to finish." };
  }
  if (rawCaption.length > MAX_CAPTION_LENGTH) {
    return { error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer.` };
  }
  const caption = rawCaption || null;

  await prisma.galleryImage.createMany({
    data: urls.map((url) => ({
      url,
      alt: caption ?? "Gallery photo",
      caption,
      published: true,
    })),
  });

  await logActivity({
    action: "created",
    resource: "GalleryImage",
    description: `Added ${urls.length} gallery photo${urls.length === 1 ? "" : "s"}${caption ? ` ("${caption}")` : ""}`,
  });

  revalidateGalleryPages();
  return { success: true };
}

export async function deleteGalleryImage(id: string) {
  await requireAdmin();
  const image = await prisma.galleryImage.delete({ where: { id } }).catch(() => null);
  if (image) {
    await deleteImage(image.url);
    await logActivity({
      action: "deleted",
      resource: "GalleryImage",
      resourceId: id,
      description: `Deleted gallery photo${image.caption ? ` "${image.caption}"` : ""}`,
    });
  }
  revalidateGalleryPages();
}

export async function toggleGalleryImagePublished(id: string, published: boolean) {
  await requireAdmin();
  const image = await prisma.galleryImage.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "GalleryImage",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} gallery photo${image.caption ? ` "${image.caption}"` : ""}`,
  });
  revalidateGalleryPages();
}
