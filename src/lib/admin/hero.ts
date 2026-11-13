import { prisma } from "@/lib/prisma";

export async function getAllHeroSlidesAdmin() {
  return prisma.heroSlide.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getAllHeroVideosAdmin() {
  return prisma.heroVideo.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getHeroMode(): Promise<"image" | "video" | "youtube"> {
  const row = await prisma.homepageSettings.findUnique({ where: { id: "singleton" }, select: { heroMode: true } });
  return row?.heroMode ?? "image";
}

// The Video Library video placed on the homepage hero (if any).
export async function getHeroYouTubeVideo() {
  const placement = await prisma.videoPlacement.findFirst({
    where: { section: "homepage_hero" },
    select: { active: true, video: { select: { title: true, published: true } } },
  });
  return placement ? { title: placement.video.title, live: placement.active && placement.video.published } : null;
}
