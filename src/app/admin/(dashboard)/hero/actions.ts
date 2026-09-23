"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated.");
}

function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/");
}

const MAX_ALT_LENGTH = 200;

function revalidateHeroPages() {
  revalidatePath("/");
  revalidatePath("/admin/hero");
}

// Images are uploaded client-side first (same direct-to-Supabase flow
// as everywhere else — see src/lib/uploadClient.ts), so this action
// just receives the resulting URLs and creates the records.
export async function addHeroSlides(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const urls = formData.getAll("imageUrls").map(String).filter(isPlausibleImageUrl);
  const rawAlt = String(formData.get("alt") || "").trim();

  if (urls.length === 0) {
    return { error: "Add at least one image before saving — please wait for uploads to finish." };
  }
  if (rawAlt.length > MAX_ALT_LENGTH) {
    return { error: `Alt text must be ${MAX_ALT_LENGTH} characters or fewer.` };
  }
  const alt = rawAlt || "Al Bustan Communities";

  const last = await prisma.heroSlide.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  await prisma.heroSlide.createMany({
    data: urls.map((url, i) => ({
      url,
      alt,
      order: nextOrder + i,
      published: true,
    })),
  });

  await logActivity({
    action: "created",
    resource: "HeroSlide",
    description: `Added ${urls.length} homepage hero slide${urls.length === 1 ? "" : "s"}`,
  });

  revalidateHeroPages();
  return { success: true };
}

// Replaces a slide's image in place — keeps its order, published
// state and alt text, so swapping in a new photo doesn't disturb the
// slider sequence the admin already set up. The file is uploaded
// client-side first, same as addHeroSlides.
export async function replaceHeroSlide(id: string, newUrl: string) {
  await requireAdmin();
  if (!isPlausibleImageUrl(newUrl)) return;

  const existing = await prisma.heroSlide.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.heroSlide.update({ where: { id }, data: { url: newUrl } });
  await logActivity({
    action: "updated",
    resource: "HeroSlide",
    resourceId: id,
    description: "Replaced a homepage hero slide's image",
  });
  revalidateHeroPages();

  if (existing.url !== newUrl) await deleteImage(existing.url);
}

export async function deleteHeroSlide(id: string) {
  await requireAdmin();
  const slide = await prisma.heroSlide.delete({ where: { id } }).catch(() => null);
  if (slide) {
    await deleteImage(slide.url);
    await logActivity({
      action: "deleted",
      resource: "HeroSlide",
      resourceId: id,
      description: "Deleted a homepage hero slide",
    });
  }
  revalidateHeroPages();
}

export async function toggleHeroSlidePublished(id: string, published: boolean) {
  await requireAdmin();
  await prisma.heroSlide.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "HeroSlide",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} a homepage hero slide`,
  });
  revalidateHeroPages();
}

export async function moveHeroSlide(id: string, direction: "up" | "down") {
  await requireAdmin();

  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = slides.findIndex((s) => s.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= slides.length) return;

  const current = slides[index];
  const neighbor = slides[swapIndex];

  await prisma.$transaction([
    prisma.heroSlide.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.heroSlide.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidateHeroPages();
}
