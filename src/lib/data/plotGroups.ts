import type { PlotGroup as PrismaPlotGroup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InventoryItem, PlotGroup, PublicPlot } from "@/lib/types";

export function mapPlotGroup(row: PrismaPlotGroup): PlotGroup {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    rows: row.rows,
    columns: row.columns,
    order: row.order,
  };
}

// Like inventory, plot groups have no publish flag of their own — the
// project's own visibility gates its pages. Backs both the admin
// editor and the public layout pages.
export async function getPlotGroupsForProject(projectId: string): Promise<PlotGroup[]> {
  const rows = await prisma.plotGroup.findMany({
    where: { projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapPlotGroup);
}

// Placed plots of one category, trimmed to what the public page may
// show (see PublicPlot).
export function toPublicPlots(items: InventoryItem[], groupId: string): PublicPlot[] {
  return items
    .filter((i) => i.groupId === groupId && i.gridRow && i.gridCol)
    .map((i) => {
      const booked = i.status !== "available";
      return {
        id: i.id,
        code: i.code,
        status: i.status,
        gridRow: i.gridRow!,
        gridCol: i.gridCol!,
        block: i.block,
        size: i.size,
        facing: i.facing,
        roadWidth: i.roadWidth,
        price: i.price,
        clientName: booked ? i.clientName : null,
        paymentMode: booked ? i.paymentMode : null,
        totalInstallments: booked ? i.totalInstallments : null,
        remainingInstallments: booked ? i.remainingInstallments : null,
      };
    });
}

// Every plot category page of a published, indexable land project —
// for the sitemap.
export async function getPublishedPlotGroupPaths() {
  const rows = await prisma.plotGroup.findMany({
    where: { project: { published: true, noIndex: false, category: "land_plot" } },
    select: { slug: true, updatedAt: true, project: { select: { slug: true } } },
  });
  return rows.map((r) => ({ path: `/projects/${r.project.slug}/plots/${r.slug}`, updatedAt: r.updatedAt }));
}

const AUTO_COLUMNS = 12;

// The project page's plot sections: each category with its placed
// plots, then — so nothing the admin added stays invisible — plots that
// aren't on any layout yet, one automatic grid per plot size (in plot
// number order). Automatic sections have an empty slug: no own page.
export function buildPlotSections(groups: PlotGroup[], items: InventoryItem[]) {
  const sections = groups
    .map((group) => ({ group, plots: toPublicPlots(items, group.id) }))
    .filter((section) => section.plots.length > 0);

  const bySize = new Map<string, InventoryItem[]>();
  for (const item of items) {
    if (item.groupId && item.gridRow && item.gridCol) continue;
    const size = item.size?.trim() || "";
    bySize.set(size, [...(bySize.get(size) ?? []), item]);
  }
  const names = new Set(sections.map((s) => s.group.name));
  for (const [size, list] of bySize) {
    const columns = Math.min(AUTO_COLUMNS, list.length);
    const name = !size ? "অন্যান্য প্লট" : names.has(size) ? `${size} (আরও)` : size;
    const id = `auto-${size.toLowerCase().replace(/\s+/g, "-") || "other"}`;
    const placed = list.map((item, i) => ({
      ...item,
      groupId: id,
      gridRow: Math.floor(i / columns) + 1,
      gridCol: (i % columns) + 1,
    }));
    sections.push({
      group: {
        id,
        projectId: list[0].projectId,
        name,
        slug: "",
        description: null,
        rows: Math.ceil(list.length / columns),
        columns,
        order: Number.MAX_SAFE_INTEGER,
      },
      plots: toPublicPlots(placed, id),
    });
  }
  return sections;
}
