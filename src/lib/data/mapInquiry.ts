import type { ContactInquiry as PrismaContactInquiry } from "@prisma/client";
import type { ContactInquiry } from "@/lib/types";

export function mapInquiry(row: PrismaContactInquiry): ContactInquiry {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    subject: row.subject,
    inquiryType: row.inquiryType,
    message: row.message,
    projectId: row.projectId,
    projectName: row.projectName,
    status: row.status,
    leadSource: row.leadSource,
    propertyType: row.propertyType,
    budget: row.budget,
    customerNotes: row.customerNotes,
    followUpDate: row.followUpDate ? row.followUpDate.toISOString() : null,
    assignedToId: row.assignedToId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
