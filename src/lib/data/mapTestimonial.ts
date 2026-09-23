import type { Testimonial as PrismaTestimonial, Project } from "@prisma/client";
import type { Testimonial } from "@/lib/types";

export const testimonialWithProject = {
  project: { select: { name: true } },
} as const;

type TestimonialWithProject = PrismaTestimonial & { project: Pick<Project, "name"> | null };

export function mapTestimonial(row: TestimonialWithProject): Testimonial {
  return {
    id: row.id,
    customerName: row.customerName,
    photoUrl: row.photoUrl,
    designation: row.designation,
    text: row.text,
    order: row.order,
    published: row.published,
    projectId: row.projectId,
    projectName: row.project?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
