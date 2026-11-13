"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("hero");
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

// --- Hero mode (image slider / video slider) ---

export async function setHeroMode(mode: "image" | "video" | "youtube") {
  await requireAdmin();
  if (mode !== "image" && mode !== "video" && mode !== "youtube") return;
  await prisma.homepageSettings.upsert({
    where: { id: "singleton" },
    update: { heroMode: mode },
    create: { id: "singleton", heroMode: mode },
  });
  await logActivity({
    action: "updated",
    resource: "HomepageSettings",
    description: `Switched the homepage hero to ${mode === "youtube" ? "the YouTube video" : `the ${mode} slider`}`,
  });
  revalidateHeroPages();
}

// --- Hero videos ---

function isPlausibleMediaUrl(value: string | null | undefined): value is string {
  return !!value && isPlausibleImageUrl(value);
}

// The video (and optional poster) are uploaded client-side first, like
// the image slides; this only records the URLs.
export async function addHeroVideo(url: string, posterUrl: string | null) {
  await requireAdmin();
  if (!isPlausibleMediaUrl(url)) {
    return { error: "Upload a video before saving — please wait for the upload to finish." };
  }

  const last = await prisma.heroVideo.findFirst({ orderBy: { order: "desc" } });
  const video = await prisma.heroVideo.create({
    data: {
      url,
      posterUrl: isPlausibleMediaUrl(posterUrl) ? posterUrl : null,
      order: (last?.order ?? -1) + 1,
      published: true,
    },
  });
  await logActivity({
    action: "created",
    resource: "HeroVideo",
    resourceId: video.id,
    description: "Added a homepage hero video",
  });
  revalidateHeroPages();
  return { success: true };
}

// Swaps the video or its cover image in place (keeps order and
// published state). A null cover removes it.
export async function replaceHeroVideoFile(id: string, field: "url" | "posterUrl", newUrl: string | null) {
  await requireAdmin();
  if (field === "url" && !isPlausibleMediaUrl(newUrl)) return;
  if (field === "posterUrl" && newUrl !== null && !isPlausibleMediaUrl(newUrl)) return;

  const existing = await prisma.heroVideo.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.heroVideo.update({ where: { id }, data: field === "url" ? { url: newUrl! } : { posterUrl: newUrl } });
  await logActivity({
    action: "updated",
    resource: "HeroVideo",
    resourceId: id,
    description:
      field === "url"
        ? "Replaced a homepage hero video"
        : newUrl
          ? "Changed a hero video's cover image"
          : "Removed a hero video's cover image",
  });
  revalidateHeroPages();

  const old = existing[field];
  if (old && old !== newUrl) await deleteImage(old);
}

export async function deleteHeroVideo(id: string) {
  await requireAdmin();
  const video = await prisma.heroVideo.delete({ where: { id } }).catch(() => null);
  if (video) {
    await deleteImage(video.url);
    if (video.posterUrl) await deleteImage(video.posterUrl);
    await logActivity({
      action: "deleted",
      resource: "HeroVideo",
      resourceId: id,
      description: "Deleted a homepage hero video",
    });
  }
  revalidateHeroPages();
}

export async function toggleHeroVideoPublished(id: string, published: boolean) {
  await requireAdmin();
  await prisma.heroVideo.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "HeroVideo",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} a homepage hero video`,
  });
  revalidateHeroPages();
}

export async function moveHeroVideo(id: string, direction: "up" | "down") {
  await requireAdmin();
  const videos = await prisma.heroVideo.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  const index = videos.findIndex((v) => v.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= videos.length) return;

  // Re-number all, so videos sharing an order value still swap.
  const reordered = [...videos];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  await prisma.$transaction(
    reordered.map((v, i) => prisma.heroVideo.update({ where: { id: v.id }, data: { order: i } }))
  );
  revalidateHeroPages();
}
