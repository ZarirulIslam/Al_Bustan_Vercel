"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { contentItemFormSchema, type ContentItemFormState } from "@/lib/admin/contentItemSchema";
import type { ContentSection } from "@/lib/types";

// Shared CRUD for every ContentItem-backed list (homepage's "What We
// Develop"/"Why Choose Al Bustan" and About's four icon-card lists) —
// imported directly by both /admin/homepage and /admin/about rather
// than duplicated per page, since the underlying model and shape are
// identical; only which public page needs revalidating differs.
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated.");
}

function revalidateForSection(section: ContentSection) {
  revalidatePath(section.startsWith("homepage_") ? "/" : "/about");
  revalidatePath(section.startsWith("homepage_") ? "/admin/homepage" : "/admin/about");
}

export async function createContentItem(
  section: ContentSection,
  _prevState: ContentItemFormState,
  formData: FormData
): Promise<ContentItemFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = contentItemFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ContentItemFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const last = await prisma.contentItem.findFirst({
    where: { section },
    orderBy: { order: "desc" },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const item = await prisma.contentItem.create({
    data: {
      section,
      title: data.title,
      description: data.description ?? "",
      icon: data.icon,
      tone: data.tone,
      order: nextOrder,
    },
  });

  await logActivity({
    action: "created",
    resource: "ContentItem",
    resourceId: item.id,
    description: `Added "${item.title}" to ${section}`,
  });

  revalidateForSection(section);
  return { success: true };
}

export async function updateContentItem(
  id: string,
  section: ContentSection,
  _prevState: ContentItemFormState,
  formData: FormData
): Promise<ContentItemFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = contentItemFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ContentItemFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.contentItem.findUnique({ where: { id } });
  if (!existing) return { error: "Item not found." };

  await prisma.contentItem.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description ?? "",
      icon: data.icon,
      tone: data.tone,
    },
  });

  await logActivity({
    action: "updated",
    resource: "ContentItem",
    resourceId: id,
    description: `Updated "${data.title}" in ${section}`,
  });

  revalidateForSection(section);
  return { success: true };
}

export async function deleteContentItem(id: string, section: ContentSection) {
  await requireAdmin();
  const item = await prisma.contentItem.delete({ where: { id } }).catch(() => null);
  if (item) {
    await logActivity({
      action: "deleted",
      resource: "ContentItem",
      resourceId: id,
      description: `Deleted "${item.title}" from ${section}`,
    });
    revalidateForSection(section);
  }
}

export async function toggleContentItemPublished(id: string, section: ContentSection, published: boolean) {
  await requireAdmin();
  const item = await prisma.contentItem.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "ContentItem",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} "${item.title}" in ${section}`,
  });
  revalidateForSection(section);
}

export async function moveContentItem(id: string, section: ContentSection, direction: "up" | "down") {
  await requireAdmin();

  const items = await prisma.contentItem.findMany({
    where: { section },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) return;

  const current = items[index];
  const neighbor = items[swapIndex];

  await prisma.$transaction([
    prisma.contentItem.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.contentItem.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidateForSection(section);
}
