import type { VideoSection } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Public side of the Video Library: the videos placed in one section of
// the site — only active placements of published videos, in the
// admin's order.
export interface PlacedVideo {
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
}

export async function getPlacedVideos(section: VideoSection, projectId?: string): Promise<PlacedVideo[]> {
  const rows = await prisma.videoPlacement.findMany({
    where: {
      section,
      active: true,
      video: { published: true },
      ...(section === "project" ? { projectId } : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { video: { select: { youtubeId: true, title: true, thumbnailUrl: true } } },
  });
  return rows.map((r) => r.video);
}

export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
