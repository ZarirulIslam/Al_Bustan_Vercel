import type { MediaSliderPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Public side of the Media Sliders (/admin/media-sliders): the
// published slides of one placement, in the admin's order.
export interface PublicMediaSlide {
  id: string;
  kind: "image" | "video" | "youtube";
  url: string | null;
  posterUrl: string | null;
  youtubeId: string | null;
  caption: string;
  focus: "center" | "top" | "bottom" | "left" | "right";
  fit: "cover" | "contain";
}

export async function getPublishedMediaSlides(placement: MediaSliderPlacement): Promise<PublicMediaSlide[]> {
  // A failed read (e.g. the table not created yet) hides the slider
  // instead of crashing the homepage / Contact page.
  const rows = await prisma.mediaSlide
    .findMany({
      where: { placement, published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, kind: true, url: true, posterUrl: true, youtubeId: true, caption: true, focus: true, fit: true },
    })
    .catch((error) => {
      console.error("[mediaSlides] could not load slides:", error);
      return [];
    });
  // Drop rows missing the field their kind needs, so a bad row can't
  // render an empty slide.
  return rows.filter((r) => (r.kind === "youtube" ? Boolean(r.youtubeId) : Boolean(r.url)));
}
