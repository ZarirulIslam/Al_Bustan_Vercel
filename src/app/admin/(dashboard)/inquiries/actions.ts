"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import type { InquiryStatus, LeadSource, PropertyType } from "@/lib/types";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated.");
}

const MAX_BUDGET_LENGTH = 200;
const MAX_NOTES_LENGTH = 2000;

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await requireAdmin();
  const inquiry = await prisma.contactInquiry.update({ where: { id }, data: { status } });
  await logActivity({
    action: "updated",
    resource: "ContactInquiry",
    resourceId: id,
    description: `Changed lead "${inquiry.name}"'s status to ${status}`,
  });
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}

export interface InquiryLeadUpdate {
  leadSource: LeadSource;
  propertyType: PropertyType | "";
  budget: string;
  customerNotes: string;
  followUpDate: string; // yyyy-mm-dd, or "" to clear
}

// Called directly with a typed object (not FormData) from the client
// — there's no Zod parse step upstream, so free-text fields are
// clamped here rather than trusted as-is.
export async function updateInquiryLead(id: string, data: InquiryLeadUpdate) {
  await requireAdmin();
  const budget = data.budget.trim().slice(0, MAX_BUDGET_LENGTH);
  const customerNotes = data.customerNotes.trim().slice(0, MAX_NOTES_LENGTH);

  const inquiry = await prisma.contactInquiry.update({
    where: { id },
    data: {
      leadSource: data.leadSource,
      propertyType: data.propertyType || null,
      budget: budget || null,
      customerNotes: customerNotes || null,
      followUpDate: data.followUpDate ? new Date(`${data.followUpDate}T00:00:00`) : null,
    },
  });
  await logActivity({
    action: "updated",
    resource: "ContactInquiry",
    resourceId: id,
    description: `Updated lead details for "${inquiry.name}"`,
  });
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}

// Covers assign, reassign, and remove-assignment alike — pass a
// sales employee id to assign/reassign, or null to unassign.
export async function updateInquiryAssignment(id: string, salesEmployeeId: string | null) {
  await requireAdmin();
  const inquiry = await prisma.contactInquiry.update({
    where: { id },
    data: { assignedToId: salesEmployeeId },
  });
  await logActivity({
    action: "updated",
    resource: "ContactInquiry",
    resourceId: id,
    description: salesEmployeeId
      ? `Assigned lead "${inquiry.name}" to a sales employee`
      : `Unassigned lead "${inquiry.name}"`,
  });
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}

export async function deleteInquiry(id: string) {
  await requireAdmin();
  const inquiry = await prisma.contactInquiry.delete({ where: { id } }).catch(() => null);
  if (inquiry) {
    await logActivity({
      action: "deleted",
      resource: "ContactInquiry",
      resourceId: id,
      description: `Deleted lead "${inquiry.name}"`,
    });
  }
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}
