import { prisma } from "@/lib/prisma";
import { mapTestimonial, testimonialWithProject } from "@/lib/data/mapTestimonial";
import type { Testimonial } from "@/lib/types";

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const rows = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: testimonialWithProject,
  });
  return rows.map(mapTestimonial);
}
