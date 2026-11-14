"use server";

import { revalidatePath } from "next/cache";
import type { MediaSliderPlacement } from "@prisma/client";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import { youtubeId as parseYouTubeId } from "@/lib/projectSections";
import { MEDIA_SLIDER_PLACEMENTS, isMediaSliderPlacement } from "@/lib/admin/mediaSlides";

const MAX_CAPTION = 200;

async function requireAdmin() {
  await requireSectionAccess("mediaSliders");
}

function isPlausibleUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/uploads/"))
  );
}

function placementLabel(placement: MediaSliderPlacement) {
  return MEDIA_SLIDER_PLACEMENTS.find((p) => p.key === placement)?.label ?? placement;
}

function revalidate(placement: MediaSliderPlacement) {
  revalidatePath(MEDIA_SLIDER_PLACEMENTS.find((p) => p.key === placement)?.path ?? "/");
  revalidatePath("/admin/media-sliders");
}

async function nextOrder(placement: MediaSliderPlacement) {
  const last = await prisma.mediaSlide.findFirst({ where: { placement }, orderBy: { order: "desc" } });
  return (last?.order ?? -1) + 1;
}

function cleanCaption(raw: unknown): string | { error: string } {
  const caption = String(raw ?? "").trim();
  return caption.length > MAX_CAPTION ? { error: `Caption must be ${MAX_CAPTION} characters or fewer.` } : caption;
}

export type AddMediaSlideInput =
  | { kind: "image"; urls: string[]; caption?: string }
  | { kind: "video"; url: string; posterUrl: string | null; caption?: string }
  | { kind: "youtube"; youtube: string; caption?: string };

// Files are uploaded client-side first (src/lib/uploadClient.ts); this
// only records the resulting URLs.
export async function addMediaSlides(placement: MediaSliderPlacement, input: AddMediaSlideInput) {
  await requireAdmin();
  if (!isMediaSliderPlacement(placement)) return { error: "Unknown slider." };

  const caption = cleanCaption(input.caption);
  if (typeof caption !== "string") return caption;

  let order = await nextOrder(placement);
  let count = 0;

  if (input.kind === "image") {
    const urls = (input.urls ?? []).filter(isPlausibleUrl);
    if (urls.length === 0) return { error: "Add at least one image — please wait for uploads to finish." };
    await prisma.mediaSlide.createMany({
      data: urls.map((url) => ({ placement, kind: "image" as const, url, caption, order: order++ })),
    });
    count = urls.length;
  } else if (input.kind === "video") {
    if (!isPlausibleUrl(input.url)) return { error: "Upload a video first — please wait for the upload to finish." };
    await prisma.mediaSlide.create({
      data: {
        placement,
        kind: "video",
        url: input.url,
        posterUrl: isPlausibleUrl(input.posterUrl) ? input.posterUrl : null,
        caption,
        order,
      },
    });
    count = 1;
  } else if (input.kind === "youtube") {
    const raw = String(input.youtube ?? "").trim();
    const id = /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : parseYouTubeId(raw);
    if (!id) return { error: "That doesn't look like a YouTube video link." };
    await prisma.mediaSlide.create({ data: { placement, kind: "youtube", youtubeId: id, caption, order } });
    count = 1;
  } else {
    return { error: "Unknown slide type." };
  }

  await logActivity({
    action: "created",
    resource: "MediaSlide",
    description: `Added ${count} slide${count === 1 ? "" : "s"} to the ${placementLabel(placement)} media slider`,
  });
  revalidate(placement);
  return { success: true };
}

export async function updateMediaSlideCaption(id: string, rawCaption: string) {
  await requireAdmin();
  const caption = cleanCaption(rawCaption);
  if (typeof caption !== "string") return caption;
  const slide = await prisma.mediaSlide.update({ where: { id }, data: { caption } });
  await logActivity({
    action: "updated",
    resource: "MediaSlide",
    resourceId: id,
    description: `Edited a caption in the ${placementLabel(slide.placement)} media slider`,
  });
  revalidate(slide.placement);
}

// Sets or clears an uploaded video's cover image.
export async function setMediaSlidePoster(id: string, posterUrl: string | null) {
  await requireAdmin();
  if (posterUrl !== null && !isPlausibleUrl(posterUrl)) return;
  const existing = await prisma.mediaSlide.findUnique({ where: { id } });
  if (!existing || existing.kind !== "video") return;
  await prisma.mediaSlide.update({ where: { id }, data: { posterUrl } });
  await logActivity({
    action: "updated",
    resource: "MediaSlide",
    resourceId: id,
    description: `${posterUrl ? "Changed" : "Removed"} a video cover in the ${placementLabel(existing.placement)} media slider`,
  });
  revalidate(existing.placement);
  if (existing.posterUrl && existing.posterUrl !== posterUrl) await deleteImage(existing.posterUrl);
}

export async function toggleMediaSlidePublished(id: string, published: boolean) {
  await requireAdmin();
  const slide = await prisma.mediaSlide.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "MediaSlide",
    resourceId: id,
    description: `${published ? "Published" : "Hid"} a slide in the ${placementLabel(slide.placement)} media slider`,
  });
  revalidate(slide.placement);
}

export async function deleteMediaSlide(id: string) {
  await requireAdmin();
  const slide = await prisma.mediaSlide.delete({ where: { id } }).catch(() => null);
  if (!slide) return;
  // Uploaded files belong to this slide only; YouTube videos are never stored.
  if (slide.url) await deleteImage(slide.url);
  if (slide.posterUrl) await deleteImage(slide.posterUrl);
  await logActivity({
    action: "deleted",
    resource: "MediaSlide",
    resourceId: id,
    description: `Deleted a slide from the ${placementLabel(slide.placement)} media slider`,
  });
  revalidate(slide.placement);
}

export async function moveMediaSlide(id: string, direction: "up" | "down") {
  await requireAdmin();
  const target = await prisma.mediaSlide.findUnique({ where: { id }, select: { placement: true } });
  if (!target) return;
  const slides = await prisma.mediaSlide.findMany({
    where: { placement: target.placement },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = slides.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= slides.length) return;

  // Re-number all, so slides sharing an order value still swap.
  const reordered = [...slides];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  await prisma.$transaction(
    reordered.map((s, i) => prisma.mediaSlide.update({ where: { id: s.id }, data: { order: i } }))
  );
  revalidate(target.placement);
}
