import { prisma } from "@/lib/prisma";
import type { SiteFaq } from "@/lib/types";
import type { SiteFaq as PrismaSiteFaq } from "@prisma/client";

function mapSiteFaq(row: PrismaSiteFaq): SiteFaq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    order: row.order,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Public read for the Contact page — only published FAQs, in order.
export async function getPublishedSiteFaqs(): Promise<SiteFaq[]> {
  const rows = await prisma.siteFaq.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapSiteFaq);
}
