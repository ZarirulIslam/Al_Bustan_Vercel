import { prisma } from "@/lib/prisma";
import { mapProjectFaq } from "@/lib/data/mapProjectFaq";
import type { ProjectFaq } from "@/lib/types";

export async function getFaqsForProjectAdmin(projectId: string): Promise<ProjectFaq[]> {
  const rows = await prisma.projectFaq.findMany({
    where: { projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapProjectFaq);
}
