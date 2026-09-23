import type { ProjectFaq as PrismaProjectFaq } from "@prisma/client";
import type { ProjectFaq } from "@/lib/types";

export function mapProjectFaq(row: PrismaProjectFaq): ProjectFaq {
  return {
    id: row.id,
    projectId: row.projectId,
    question: row.question,
    answer: row.answer,
    order: row.order,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
