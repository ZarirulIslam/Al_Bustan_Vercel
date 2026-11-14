import type { MediaSliderPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const MEDIA_SLIDER_PLACEMENTS = [
  { key: "homepage", label: "Homepage", where: "the section right after the homepage hero", path: "/" },
  { key: "contact", label: "Contact Us", where: "the Contact Us page, above the FAQ", path: "/contact" },
] as const satisfies readonly { key: MediaSliderPlacement; label: string; where: string; path: string }[];

export function isMediaSliderPlacement(value: unknown): value is MediaSliderPlacement {
  return MEDIA_SLIDER_PLACEMENTS.some((p) => p.key === value);
}

export async function getMediaSlidesAdmin(placement: MediaSliderPlacement) {
  return prisma.mediaSlide.findMany({
    where: { placement },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

// Published Video Library videos, for the "pick from library" list.
export async function getLibraryVideoOptions() {
  return prisma.youTubeVideo.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { youtubeId: true, title: true },
    take: 200,
  });
}
