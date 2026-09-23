import type { Project as PrismaProject, ProjectImage as PrismaImage } from "@prisma/client";
import type { Project } from "@/lib/types";

type PrismaProjectWithImages = PrismaProject & {
  coverImage: PrismaImage | null;
  gallery: PrismaImage[];
};

export function mapProject(p: PrismaProjectWithImages): Project {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    status: p.status, // Prisma's ProjectStatus enum values match our Project type's status union
    category: p.category,
    location: p.location,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    projectType: p.projectType,
    totalArea: p.totalArea,
    unitInfo: p.unitInfo,
    timeline: p.timeline,
    features: p.features,
    latitude: p.latitude,
    longitude: p.longitude,
    totalUnits: p.totalUnits,
    availableUnits: p.availableUnits,
    sizesOffered: p.sizesOffered,
    pricingInfo: p.pricingInfo,
    nearbyFacilities: p.nearbyFacilities,
    brochureUrl: p.brochureUrl,
    masterPlanUrl: p.masterPlanUrl,
    bedroomOptions: p.bedroomOptions,
    block: p.block,
    facing: p.facing,
    frontRoadWidth: p.frontRoadWidth,
    coverImage: p.coverImage
      ? { id: p.coverImage.id, url: p.coverImage.url, alt: p.coverImage.alt }
      : { id: "placeholder", url: "", alt: "" },
    gallery: p.gallery.map((g) => ({ id: g.id, url: g.url, alt: g.alt })),
    published: p.published,
    featured: p.featured,
    seoTitle: p.seoTitle,
    metaDescription: p.metaDescription,
    ogImageUrl: p.ogImageUrl,
    canonicalUrl: p.canonicalUrl,
    noIndex: p.noIndex,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const projectWithImages = {
  coverImage: true,
  gallery: true,
} as const;
