import { prisma } from "@/lib/prisma";

export async function getAllHeroSlidesAdmin() {
  return prisma.heroSlide.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}
