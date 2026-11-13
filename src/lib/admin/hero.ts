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

export async function getHeroMode(): Promise<"image" | "video"> {
  const row = await prisma.homepageSettings.findUnique({ where: { id: "singleton" }, select: { heroMode: true } });
  return row?.heroMode ?? "image";
}
