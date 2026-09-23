import { prisma } from "@/lib/prisma";
import type { GalleryItem } from "@/lib/types";

// Combines photos from every published project (cover + gallery
// images) with standalone images the admin added directly, so the
// public Gallery page shows one unified set without the admin
// having to re-upload anything that's already on a project.
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const [projects, standalone] = await Promise.all([
    prisma.project.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      include: { coverImage: true, gallery: true },
    }),
    prisma.galleryImage.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const projectItems: GalleryItem[] = projects.flatMap((project) => {
    const images = [
      ...(project.coverImage ? [project.coverImage] : []),
      ...project.gallery,
    ];
    return images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      source: "project" as const,
      projectSlug: project.slug,
      projectName: project.name,
    }));
  });

  const standaloneItems: GalleryItem[] = standalone.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
    source: "standalone" as const,
    caption: img.caption,
  }));

  // Standalone images first (what the admin specifically curated for
  // this page), then project photos, most recently updated first.
  return [...standaloneItems, ...projectItems];
}
