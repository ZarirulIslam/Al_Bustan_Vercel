import type { InventoryItem as PrismaInventoryItem } from "@prisma/client";
import type { InventoryItem } from "@/lib/types";

export function mapInventoryItem(row: PrismaInventoryItem): InventoryItem {
  return {
    id: row.id,
    projectId: row.projectId,
    code: row.code,
    size: row.size,
    facing: row.facing,
    price: row.price,
    status: row.status,
    block: row.block,
    roadWidth: row.roadWidth,
    floor: row.floor,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
