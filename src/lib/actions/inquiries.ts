"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { inquiryFormSchema, type InquirySubmitState } from "@/lib/inquirySchema";

// Public — no admin auth here by design; this is the form real
// visitors submit. Shared by the general contact form (/contact,
// no project context) and each project's inquiry form
// (/projects/[slug], with projectId/projectName pre-filled), since
// both ultimately create the same kind of record.
export async function submitInquiry(
  _prevState: InquirySubmitState,
  formData: FormData
): Promise<InquirySubmitState> {
  const raw = Object.fromEntries(formData.entries());
  // The project lead form treats the message as optional.
  if (raw.messageOptional === "1" && !String(raw.message ?? "").trim()) raw.message = "—";
  if (!raw.propertyType) delete raw.propertyType;
  const parsed = inquiryFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: InquirySubmitState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const isSiteVisit = data.intent === "site_visit";

  await prisma.contactInquiry.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      subject: isSiteVisit && data.projectName ? `Site visit request: ${data.projectName}` : data.subject,
      inquiryType: isSiteVisit ? "site_visit" : data.inquiryType,
      propertyType: data.propertyType ?? null,
      message: data.message,
      projectId: data.projectId || null,
      projectName: data.projectName || null,
      // Every public submission arrives through the website; admins
      // can change this afterward for leads logged from other
      // channels (see updateInquiryLead).
      leadSource: "website",
    },
  });

  revalidatePath("/admin/inquiries");

  return { success: true };
}

// "প্লট বুকিং" form on land project pages. Saved as a lead like any other
// inquiry (inquiry type "buying", property type land/plot), with the
// requested block / plot / size spelled out in the message so sales sees
// everything in Leads & Inquiries.
const plotBookingSchema = z.object({
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  name: z.string().trim().min(1, "required"),
  block: z.string().trim().min(1, "required"),
  address: z.string().trim().min(1, "required"),
  road: z.string().trim().optional(),
  phone: z.string().trim().min(6, "required"),
  plotNo: z.string().trim().optional(),
  email: z.string().trim().email("email"),
  size: z.string().trim().min(1, "required"),
});

export interface PlotBookingState {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof plotBookingSchema>, string>>;
}

export async function submitPlotBooking(_prev: PlotBookingState, formData: FormData): Promise<PlotBookingState> {
  const parsed = plotBookingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: PlotBookingState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<PlotBookingState["fieldErrors"]>;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const d = parsed.data;

  const message = [
    `ব্লক: ${d.block}`,
    `প্লট নং: ${d.plotNo || "—"}`,
    `আয়তন (কাঠা): ${d.size}`,
    `ঠিকানা: ${d.address}`,
    `রোড / রাস্তা: ${d.road || "—"}`,
  ].join("\n");

  await prisma.contactInquiry.create({
    data: {
      name: d.name,
      phone: d.phone,
      email: d.email,
      subject: `Plot booking: ${d.projectName}`,
      inquiryType: "buying",
      propertyType: "land_plot",
      message,
      projectId: d.projectId,
      projectName: d.projectName,
      leadSource: "website",
    },
  });

  revalidatePath("/admin/inquiries");
  return { success: true };
}
