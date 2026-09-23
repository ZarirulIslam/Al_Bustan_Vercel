import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mapInquiry } from "@/lib/data/mapInquiry";
import type { ContactInquiry, InquiryStatus, LeadSource } from "@/lib/types";

export interface InquiryFilters {
  status?: InquiryStatus;
  projectId?: string;
  leadSource?: LeadSource;
  search?: string;
  dateFrom?: string; // yyyy-mm-dd, inclusive
  dateTo?: string; // yyyy-mm-dd, inclusive
  // A specific sales employee id, the sentinel "unassigned" (matches
  // assignedToId: null), or undefined (no filter).
  assignedTo?: string;
}

export async function getAllInquiriesAdmin(filters: InquiryFilters = {}): Promise<ContactInquiry[]> {
  const { status, projectId, leadSource, search, dateFrom, dateTo, assignedTo } = filters;

  const where: Prisma.ContactInquiryWhereInput = {};
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (leadSource) where.leadSource = leadSource;
  if (assignedTo === "unassigned") where.assignedToId = null;
  else if (assignedTo) where.assignedToId = assignedTo;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00`) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
    };
  }

  const rows = await prisma.contactInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapInquiry);
}

// Distinct projects referenced by at least one inquiry, for the admin
// project filter dropdown. Reads off ContactInquiry itself (not the
// Project table) since the filter should only ever offer projects
// that actually have inquiries against them, and the soft
// projectId/projectName reference already carries the name even for
// a since-deleted project.
export async function getInquiryProjectOptions(): Promise<{ id: string; name: string }[]> {
  const rows = await prisma.contactInquiry.findMany({
    where: { projectId: { not: null } },
    select: { projectId: true, projectName: true },
    distinct: ["projectId"],
    orderBy: { projectName: "asc" },
  });
  return rows
    .filter((row): row is { projectId: string; projectName: string | null } => row.projectId !== null)
    .map((row) => ({ id: row.projectId, name: row.projectName ?? row.projectId }));
}

export async function getInquiryCounts() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  const [total, newCount, contacted, followUp, converted, closed, dueToday, overdue, unassigned] =
    await Promise.all([
      prisma.contactInquiry.count(),
      prisma.contactInquiry.count({ where: { status: "new" } }),
      prisma.contactInquiry.count({ where: { status: "contacted" } }),
      prisma.contactInquiry.count({ where: { status: "follow_up" } }),
      prisma.contactInquiry.count({ where: { status: "converted" } }),
      prisma.contactInquiry.count({ where: { status: "closed" } }),
      prisma.contactInquiry.count({
        where: {
          followUpDate: { gte: startOfToday, lte: endOfToday },
          status: { notIn: ["converted", "closed"] },
        },
      }),
      prisma.contactInquiry.count({
        where: {
          followUpDate: { lt: startOfToday },
          status: { notIn: ["converted", "closed"] },
        },
      }),
      // Unassigned leads still worth acting on — excludes converted/closed,
      // same convention as the follow-up stats above.
      prisma.contactInquiry.count({
        where: {
          assignedToId: null,
          status: { notIn: ["converted", "closed"] },
        },
      }),
    ]);

  return {
    total,
    new: newCount,
    contacted,
    followUp,
    converted,
    closed,
    followUpsDueToday: dueToday,
    followUpsOverdue: overdue,
    unassigned,
  };
}
