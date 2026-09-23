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

// Public read — only published items, in display order. Used by the
// homepage's "What We Develop"/"Why Choose Al Bustan" sections and
// the About page's four icon-card lists.
export async function getPublishedContentItems(section: ContentSection): Promise<ContentItem[]> {
  const rows = await prisma.contentItem.findMany({
    where: { section, published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapContentItem);
}
