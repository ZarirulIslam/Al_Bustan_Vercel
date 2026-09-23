import { prisma } from "@/lib/prisma";

export async function getAllGalleryImagesAdmin() {
  return prisma.galleryImage.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getGalleryImageCount() {
  return prisma.galleryImage.count();
}
