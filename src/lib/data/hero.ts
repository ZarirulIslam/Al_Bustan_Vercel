import { prisma } from "@/lib/prisma";

export async function getPublishedHeroSlides() {
  return prisma.heroSlide.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getPublishedHeroVideos() {
  return prisma.heroVideo.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}
