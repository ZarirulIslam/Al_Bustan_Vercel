"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import type { AdminSection } from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { contentItemFormSchema, type ContentItemFormState } from "@/lib/admin/contentItemSchema";
import type { ContentSection } from "@/lib/types";

// Shared CRUD for every ContentItem-backed list (homepage's "What We
// Develop"/"Why Choose Al Bustan" and About's four icon-card lists) —
// imported directly by both /admin/homepage and /admin/about rather
// than duplicated per page, since the underlying model and shape are
// identical; only which public page needs revalidating differs.
//
// Access follows the page the list lives on: homepage_* lists need the
// Homepage section, about_* lists the About Page section. For actions
// on an existing item its *stored* section is checked too, since the
// section argument comes from the client.
function pageSectionFor(section: ContentSection): AdminSection {
  return section.startsWith("homepage_") ? "homepage" : "about";
}

async function requireContentAccess(section: ContentSection, itemId?: string) {
  await requireSectionAccess(pageSectionFor(section));
  if (itemId) {
    const item = await prisma.contentItem.findUnique({ where: { id: itemId }, select: { section: true } });
    if (item) await requireSectionAccess(pageSectionFor(item.section as ContentSection));
  }
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
  await requireContentAccess(section);

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
  await requireContentAccess(section, id);

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
  await requireContentAccess(section, id);
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
  await requireContentAccess(section, id);
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
  await requireContentAccess(section, id);

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
