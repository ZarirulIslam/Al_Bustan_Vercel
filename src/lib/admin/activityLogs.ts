import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ActivityLogEntry, ActivityAction } from "@/lib/types";

export interface ActivityLogFilters {
  resource?: string;
  action?: ActivityAction;
  dateFrom?: string; // yyyy-mm-dd, inclusive
  dateTo?: string; // yyyy-mm-dd, inclusive
  q?: string; // matches admin email or description
}

function mapActivityLog(row: {
  id: string;
  adminUserId: string | null;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string;
  createdAt: Date;
}): ActivityLogEntry {
  return {
    id: row.id,
    adminUserId: row.adminUserId,
    adminEmail: row.adminEmail,
    action: row.action as ActivityAction,
    resource: row.resource,
    resourceId: row.resourceId,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}

// Capped at 200 — this is an audit viewer, not a paginated export
// tool; the filters below are how an admin narrows a large history
// down to what they're looking for.
export async function getActivityLogsAdmin(
  filters: ActivityLogFilters = {},
  limit = 200
): Promise<ActivityLogEntry[]> {
  const { resource, action, dateFrom, dateTo, q } = filters;

  const where: Prisma.ActivityLogWhereInput = {};
  if (resource) where.resource = resource;
  if (action) where.action = action;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00`) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
    };
  }

  if (q) {
    where.OR = [
      { adminEmail: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapActivityLog);
}

// Populates the "Resource" filter dropdown from whatever resources
// have actually been logged, rather than a hardcoded list that could
// drift from what logActivity() calls actually use.
export async function getDistinctActivityResources(): Promise<string[]> {
  const rows = await prisma.activityLog.findMany({
    select: { resource: true },
    distinct: ["resource"],
    orderBy: { resource: "asc" },
  });
  return rows.map((r) => r.resource);
}
