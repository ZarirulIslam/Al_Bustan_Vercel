import { prisma } from "@/lib/prisma";
import { mapTestimonial, testimonialWithProject } from "@/lib/data/mapTestimonial";
import type { Testimonial } from "@/lib/types";

export async function getAllTestimonialsAdmin(): Promise<Testimonial[]> {
  const rows = await prisma.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: testimonialWithProject,
  });
  return rows.map(mapTestimonial);
}

export async function getTestimonialByIdAdmin(id: string): Promise<Testimonial | null> {
  const row = await prisma.testimonial.findUnique({
    where: { id },
    include: testimonialWithProject,
  });
  return row ? mapTestimonial(row) : null;
}

// Minimal {id, name} shape for the "Related project" picker — same
// convention as getAllCategoriesAdmin() for the blog form.
export async function getProjectOptionsForTestimonials(): Promise<{ id: string; name: string }[]> {
  return prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
