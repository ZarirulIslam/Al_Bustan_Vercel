import { prisma } from "@/lib/prisma";
import type { ProjectSectionItem as PrismaProjectSectionItem } from "@prisma/client";
import type { ProjectItemSection, ProjectSectionItem } from "@/lib/types";

export function mapProjectSectionItem(row: PrismaProjectSectionItem): ProjectSectionItem {
  return {
    id: row.id,
    projectId: row.projectId,
    section: row.section,
    order: row.order,
    published: row.published,
    icon: row.icon,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    tab: row.tab,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type ProjectSectionItemsBySection = Record<ProjectItemSection, ProjectSectionItem[]>;

function groupBySection(items: ProjectSectionItem[]): ProjectSectionItemsBySection {
  const grouped: ProjectSectionItemsBySection = {
    location_highlight: [],
    key_feature: [],
    plot_type: [],
    goal: [],
    security: [],
    amenity: [],
    floor_plan: [],
    investment_reason: [],
    stat: [],
    route: [],
    partner: [],
  };
  for (const item of items) grouped[item.section].push(item);
  return grouped;
}

// Public read — published items only, grouped by section, in display order.
export async function getPublishedSectionItemsForProject(projectId: string): Promise<ProjectSectionItemsBySection> {
  const rows = await prisma.projectSectionItem.findMany({
    where: { projectId, published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return groupBySection(rows.map(mapProjectSectionItem));
}

// Admin read — every item, including hidden ones.
export async function getSectionItemsForProjectAdmin(projectId: string): Promise<ProjectSectionItemsBySection> {
  const rows = await prisma.projectSectionItem.findMany({
    where: { projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return groupBySection(rows.map(mapProjectSectionItem));
}
