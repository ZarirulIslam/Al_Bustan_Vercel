import { prisma } from "@/lib/prisma";
import { mapProjectFaq } from "@/lib/data/mapProjectFaq";
import type { ProjectFaq } from "@/lib/types";

// Public, published-only data access — mirrors src/lib/data/hero.ts's
// getPublishedHeroSlides. Admin CRUD (including unpublished FAQs)
// lives separately in src/lib/admin/projectFaqs.ts.
export async function getPublishedFaqsForProject(projectId: string): Promise<ProjectFaq[]> {
  const rows = await prisma.projectFaq.findMany({
    where: { projectId, published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapProjectFaq);
}
