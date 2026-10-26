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
    groupId: row.groupId,
    gridRow: row.gridRow,
    gridCol: row.gridCol,
    floor: row.floor,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    clientName: row.clientName,
    fileNumber: row.fileNumber,
    paymentMode: row.paymentMode,
    totalInstallments: row.totalInstallments,
    remainingInstallments: row.remainingInstallments,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
