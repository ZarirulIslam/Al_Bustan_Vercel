import { prisma } from "@/lib/prisma";
import type { ContentItem, ContentSection } from "@/lib/types";
import type { ContentItem as PrismaContentItem } from "@prisma/client";

function mapContentItem(row: PrismaContentItem): ContentItem {
  return {
    id: row.id,
    section: row.section,
    order: row.order,
    published: row.published,
    icon: row.icon,
    tone: row.tone,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Admin read — every item for a section (published or not), for the
// manager list at /admin/homepage and /admin/about.
export async function getContentItemsForSectionAdmin(section: ContentSection): Promise<ContentItem[]> {
  const rows = await prisma.contentItem.findMany({
    where: { section },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapContentItem);
}
