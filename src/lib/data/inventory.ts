import { prisma } from "@/lib/prisma";
import { mapInventoryItem } from "@/lib/data/mapInventoryItem";
import type { InventoryItem } from "@/lib/types";

// Inventory items have no publish flag of their own — a project's
// public visibility already gates its detail page (see
// getProjectBySlug), so every item for a published project is shown
// there for transparency. This same query backs both the admin
// editor and the public detail page.
export async function getInventoryForProject(projectId: string): Promise<InventoryItem[]> {
  const rows = await prisma.inventoryItem.findMany({
    where: { projectId },
    orderBy: { code: "asc" },
  });
  return rows.map(mapInventoryItem);
}
