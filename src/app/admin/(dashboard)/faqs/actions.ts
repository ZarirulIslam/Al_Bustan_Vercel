"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { siteFaqFormSchema, type SiteFaqFormState } from "@/lib/admin/siteFaqSchema";

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("faqs");
}

function revalidateFaqPages() {
  revalidatePath("/contact");
  revalidatePath("/admin/faqs");
}

export async function createSiteFaq(
  _prevState: SiteFaqFormState,
  formData: FormData
): Promise<SiteFaqFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = siteFaqFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: SiteFaqFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const last = await prisma.siteFaq.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  const faq = await prisma.siteFaq.create({
    data: { question: data.question, answer: data.answer, order: nextOrder },
  });

  await logActivity({
    action: "created",
    resource: "SiteFaq",
    resourceId: faq.id,
    description: `Added FAQ "${faq.question}"`,
  });

  revalidateFaqPages();
  return { success: true };
}

export async function updateSiteFaq(
  id: string,
  _prevState: SiteFaqFormState,
  formData: FormData
): Promise<SiteFaqFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = siteFaqFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: SiteFaqFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.siteFaq.findUnique({ where: { id } });
  if (!existing) return { error: "FAQ not found." };

  await prisma.siteFaq.update({
    where: { id },
    data: { question: data.question, answer: data.answer },
  });

  await logActivity({
    action: "updated",
    resource: "SiteFaq",
    resourceId: id,
    description: `Updated FAQ "${data.question}"`,
  });

  revalidateFaqPages();
  return { success: true };
}

export async function deleteSiteFaq(id: string) {
  await requireAdmin();
  const faq = await prisma.siteFaq.delete({ where: { id } }).catch(() => null);
  if (faq) {
    await logActivity({
      action: "deleted",
      resource: "SiteFaq",
      resourceId: id,
      description: `Deleted FAQ "${faq.question}"`,
    });
    revalidateFaqPages();
  }
}

export async function toggleSiteFaqPublished(id: string, published: boolean) {
  await requireAdmin();
  const faq = await prisma.siteFaq.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "SiteFaq",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} FAQ "${faq.question}"`,
  });
  revalidateFaqPages();
}

export async function moveSiteFaq(id: string, direction: "up" | "down") {
  await requireAdmin();

  const faqs = await prisma.siteFaq.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  const index = faqs.findIndex((f) => f.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= faqs.length) return;

  const current = faqs[index];
  const neighbor = faqs[swapIndex];

  await prisma.$transaction([
    prisma.siteFaq.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.siteFaq.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidateFaqPages();
}
