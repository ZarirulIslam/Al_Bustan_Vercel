"use server";

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

  await prisma.contactInquiry.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      subject: data.subject,
      inquiryType: data.inquiryType,
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
