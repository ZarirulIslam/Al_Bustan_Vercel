"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import { redirectWithFlash } from "@/lib/admin/flash";
import {
  parseVideoUrls,
  projectFormSchema,
  type ProjectFormState,
  type ProjectFormValues,
} from "@/lib/admin/projectSchema";
import {
  projectSectionItemFormSchema,
  type ProjectSectionItemFormState,
} from "@/lib/admin/projectSectionItemSchema";
import { PROJECT_SECTIONS, isGalleryCategory, projectEditPath } from "@/lib/projectSections";
import {
  inventoryItemData,
  inventoryItemFormSchema,
  type InventoryItemFormState,
} from "@/lib/admin/inventorySchema";
import { MAX_GRID, plotGroupFormSchema, type PlotGroupFormState } from "@/lib/admin/plotGroupSchema";
import { parseNumberList, parseRange, planRangeFill, rangeCodeSets } from "@/lib/plotLayout";
import {
  paymentPlanFormSchema,
  type PaymentPlanFormState,
} from "@/lib/admin/paymentPlanSchema";
import {
  projectFaqFormSchema,
  type ProjectFaqFormState,
} from "@/lib/admin/projectFaqSchema";
import type { InventoryStatus, ProjectItemSection } from "@/lib/types";

// Images are no longer uploaded through these server actions. The
// admin form uploads cover/gallery images directly from the browser
// to Supabase Storage (src/lib/uploadClient.ts, via the signed-URL
// route at src/app/api/admin/upload-url/route.ts) and submits only
// the resulting URLs here — this keeps every request to this action
// tiny (text only) regardless of how many/large the images are,
// which is what keeps this reliable on Vercel's ~4.5MB Serverless
// Function request-body ceiling.

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("projects");
}

function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/");
}

// Detail-page presentation fields added for the redesigned project
// pages — flat-only specs are cleared for land/plot projects, same as
// bedroomOptions.
function presentationFields(data: ProjectFormValues) {
  const isFlat = data.category === "flat";
  const text = (value: string | undefined) => value?.trim() || null;
  return {
    floors: isFlat ? text(data.floors) : null,
    parkingSpaces: isFlat ? text(data.parkingSpaces) : null,
    lifts: isFlat ? text(data.lifts) : null,
    stairs: isFlat ? text(data.stairs) : null,
    tagline: text(data.tagline),
    approvalInfo: text(data.approvalInfo),
    openSpace: isFlat ? null : text(data.openSpace),
    handoverDate: text(data.handoverDate),
    videoUrls: parseVideoUrls(data.videoUrls),
  };
}

// Each editor (Land / Apartment) only submits the fields its page
// uses. On update, a field that wasn't submitted keeps its stored value
// instead of being blanked — e.g. saving from the Apartment editor never
// wipes text that only the Land editor (or older data) holds. Keys must
// match the form field names.
function onlySubmitted<T extends Record<string, unknown>>(formData: FormData, fields: T): Partial<T> {
  return Object.fromEntries(Object.entries(fields).filter(([key]) => formData.has(key))) as Partial<T>;
}

// Gallery filter tab chosen in the form ("" or anything unknown = none).
function galleryCategoryFrom(value: FormDataEntryValue | null): string | null {
  const category = String(value ?? "");
  return isGalleryCategory(category) ? category : null;
}

function revalidatePublicProjectPages() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/projects/ongoing");
  revalidatePath("/projects/completed");
  revalidatePath("/projects/upcoming");
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = projectFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: ProjectFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existingSlug = await prisma.project.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    return { fieldErrors: { slug: "This slug is already in use." } };
  }

  const coverUrl = String(formData.get("coverImageUrl") || "");
  if (!coverUrl || !isPlausibleImageUrl(coverUrl)) {
    return { error: "A cover image is required — please wait for it to finish uploading." };
  }

  const galleryUrls = formData
    .getAll("newGalleryImageUrls")
    .map(String)
    .filter(isPlausibleImageUrl);

  const rawMasterPlanUrl = String(formData.get("masterPlanUrl") || "");
  const masterPlanUrl = isPlausibleImageUrl(rawMasterPlanUrl) ? rawMasterPlanUrl : null;

  const rawBrochureUrl = String(formData.get("brochureUrl") || "");
  const brochureUrl = isPlausibleImageUrl(rawBrochureUrl) ? rawBrochureUrl : null;

  const rawOgImageUrl = String(formData.get("ogImageUrl") || "");
  const ogImageUrl = isPlausibleImageUrl(rawOgImageUrl) ? rawOgImageUrl : null;

  const rawIntroVideoUrl = String(formData.get("introVideoUrl") || "");
  const introVideoUrl = isPlausibleImageUrl(rawIntroVideoUrl) ? rawIntroVideoUrl : null;

  const project = await prisma.project.create({
    data: {
      name: data.name,
      slug: data.slug,
      status: data.status,
      category: data.category,
      location: data.location,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      projectType: data.projectType,
      totalArea: data.totalArea,
      unitInfo: data.unitInfo ?? "",
      timeline: data.timeline ?? "",
      features: data.features,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      totalUnits: data.totalUnits ? Number(data.totalUnits) : null,
      availableUnits: data.availableUnits ? Number(data.availableUnits) : null,
      sizesOffered: data.sizesOffered || null,
      pricingInfo: data.pricingInfo || null,
      nearbyFacilities: data.nearbyFacilities,
      bedroomOptions: data.category === "flat" ? data.bedroomOptions || null : null,
      ...presentationFields(data),
      block: data.block || null,
      facing: data.facing || null,
      frontRoadWidth: data.frontRoadWidth || null,
      masterPlanUrl,
      brochureUrl,
      introVideoUrl,
      published: data.published === "on",
      seoTitle: data.seoTitle?.trim() || null,
      metaDescription: data.metaDescription?.trim() || null,
      ogImageUrl,
      canonicalUrl: data.canonicalUrl?.trim() || null,
      noIndex: data.noIndex === "on",
      coverImage: { create: { url: coverUrl, alt: data.name } },
      gallery: {
        create: galleryUrls.map((url) => ({
          url,
          alt: data.name,
          category: galleryCategoryFrom(formData.get("newGalleryCategory")),
        })),
      },
    },
  });

  await logActivity({
    action: "created",
    resource: "Project",
    resourceId: project.id,
    description: `Created project "${project.name}"`,
  });

  revalidatePublicProjectPages();
  revalidatePath("/admin/projects", "layout");
  return redirectWithFlash(
    projectEditPath(project),
    `Project "${project.name}" created — now fill in its page sections.`
  );
}

export async function updateProject(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = projectFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: ProjectFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.project.findUnique({
    where: { id },
    include: { coverImage: true, gallery: true },
  });
  if (!existing) return { error: "Project not found." };

  if (data.slug !== existing.slug) {
    const slugTaken = await prisma.project.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return { fieldErrors: { slug: "This slug is already in use." } };
  }

  const rawCoverUrl = String(formData.get("coverImageUrl") || "");
  const newCoverUrl = isPlausibleImageUrl(rawCoverUrl) ? rawCoverUrl : null;

  const newGalleryUrls = formData
    .getAll("newGalleryImageUrls")
    .map(String)
    .filter(isPlausibleImageUrl);

  const removeGalleryIds = formData.getAll("removeGalleryImage").map(String);

  const rawMasterPlanUrl = String(formData.get("masterPlanUrl") || "");
  const newMasterPlanUrl = isPlausibleImageUrl(rawMasterPlanUrl) ? rawMasterPlanUrl : null;

  const rawBrochureUrl = String(formData.get("brochureUrl") || "");
  const newBrochureUrl = isPlausibleImageUrl(rawBrochureUrl) ? rawBrochureUrl : null;

  const rawOgImageUrl = String(formData.get("ogImageUrl") || "");
  const newOgImageUrl = isPlausibleImageUrl(rawOgImageUrl) ? rawOgImageUrl : null;

  const rawIntroVideoUrl = String(formData.get("introVideoUrl") || "");
  const newIntroVideoUrl = isPlausibleImageUrl(rawIntroVideoUrl) ? rawIntroVideoUrl : null;
  // A new upload wins over a ticked "Remove video".
  const removeIntroVideo = !newIntroVideoUrl && formData.get("removeIntroVideo") === "on";

  await prisma.$transaction(async (tx) => {
    if (removeGalleryIds.length > 0) {
      await tx.projectImage.deleteMany({ where: { id: { in: removeGalleryIds } } });
    }

    for (const image of existing.gallery) {
      if (removeGalleryIds.includes(image.id) || !formData.has(`galleryCategory:${image.id}`)) continue;
      const category = galleryCategoryFrom(formData.get(`galleryCategory:${image.id}`));
      if (category !== image.category) {
        await tx.projectImage.update({ where: { id: image.id }, data: { category } });
      }
    }

    if (newCoverUrl) {
      if (existing.coverImageId) {
        await tx.projectImage.update({
          where: { id: existing.coverImageId },
          data: { url: newCoverUrl, alt: data.name },
        });
      } else {
        await tx.project.update({
          where: { id },
          data: { coverImage: { create: { url: newCoverUrl, alt: data.name } } },
        });
      }
    }

    await tx.project.update({
      where: { id },
      data: {
        ...onlySubmitted(formData, {
          name: data.name,
          slug: data.slug,
          status: data.status,
          category: data.category,
          location: data.location,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          projectType: data.projectType,
          totalArea: data.totalArea,
          unitInfo: data.unitInfo,
          timeline: data.timeline,
          features: data.features,
          latitude: data.latitude ? Number(data.latitude) : null,
          longitude: data.longitude ? Number(data.longitude) : null,
          totalUnits: data.totalUnits ? Number(data.totalUnits) : null,
          availableUnits: data.availableUnits ? Number(data.availableUnits) : null,
          sizesOffered: data.sizesOffered || null,
          pricingInfo: data.pricingInfo || null,
          nearbyFacilities: data.nearbyFacilities,
          bedroomOptions: data.category === "flat" ? data.bedroomOptions || null : null,
          ...presentationFields(data),
          block: data.block || null,
          facing: data.facing || null,
          frontRoadWidth: data.frontRoadWidth || null,
          seoTitle: data.seoTitle?.trim() || null,
          metaDescription: data.metaDescription?.trim() || null,
          canonicalUrl: data.canonicalUrl?.trim() || null,
        }),
        // Checkboxes send nothing when unticked, so these always apply.
        published: data.published === "on",
        noIndex: data.noIndex === "on",
        gallery: {
          create: newGalleryUrls.map((url) => ({
            url,
            alt: data.name,
            category: galleryCategoryFrom(formData.get("newGalleryCategory")),
          })),
        },
        ...(newMasterPlanUrl ? { masterPlanUrl: newMasterPlanUrl } : {}),
        ...(newBrochureUrl ? { brochureUrl: newBrochureUrl } : {}),
        ...(newOgImageUrl ? { ogImageUrl: newOgImageUrl } : {}),
        ...(newIntroVideoUrl ? { introVideoUrl: newIntroVideoUrl } : {}),
        ...(removeIntroVideo ? { introVideoUrl: null } : {}),
      },
    });
  });

  // Best-effort cleanup — the DB is already the source of truth at
  // this point, so a storage delete failure here is a leftover file,
  // not a data-integrity problem.
  if (newCoverUrl && existing.coverImage) {
    await deleteImage(existing.coverImage.url);
  }
  if (newMasterPlanUrl && existing.masterPlanUrl) {
    await deleteImage(existing.masterPlanUrl);
  }
  if (newOgImageUrl && existing.ogImageUrl) {
    await deleteImage(existing.ogImageUrl);
  }
  if (newBrochureUrl && existing.brochureUrl) {
    await deleteImage(existing.brochureUrl);
  }
  if ((newIntroVideoUrl || removeIntroVideo) && existing.introVideoUrl) {
    await deleteImage(existing.introVideoUrl);
  }
  const removedGalleryUrls = existing.gallery
    .filter((g) => removeGalleryIds.includes(g.id))
    .map((g) => g.url);
  await Promise.all(removedGalleryUrls.map((url) => deleteImage(url)));

  await logActivity({
    action: "updated",
    resource: "Project",
    resourceId: id,
    description: `Updated project "${data.name}"`,
  });

  revalidatePublicProjectPages();
  revalidatePath("/admin/projects", "layout");
  // Stays on the editor (it may be mid-way through a long page); the
  // client shows the toast and refreshes from the revalidated data.
  return { success: true };
}

export async function deleteProject(id: string) {
  await requireAdmin();

  const project = await prisma.project.findUnique({
    where: { id },
    include: { coverImage: true, gallery: true, sectionItems: { select: { imageUrl: true } } },
  });
  if (!project) return;

  await prisma.$transaction(async (tx) => {
    await tx.project.delete({ where: { id } }); // cascades gallery images
    if (project.coverImageId) {
      await tx.projectImage.delete({ where: { id: project.coverImageId } }).catch(() => {});
    }
  });

  const urlsToClean = [
    ...(project.coverImage ? [project.coverImage.url] : []),
    ...project.gallery.map((g) => g.url),
    ...(project.masterPlanUrl ? [project.masterPlanUrl] : []),
    ...(project.brochureUrl ? [project.brochureUrl] : []),
    ...(project.introVideoUrl ? [project.introVideoUrl] : []),
    ...(project.ogImageUrl ? [project.ogImageUrl] : []),
    ...project.sectionItems.flatMap((item) => (item.imageUrl ? [item.imageUrl] : [])),
  ];
  await Promise.all(urlsToClean.map((url) => deleteImage(url)));

  await logActivity({
    action: "deleted",
    resource: "Project",
    resourceId: id,
    description: `Deleted project "${project.name}"`,
  });

  revalidatePublicProjectPages();
  revalidatePath("/admin/projects", "layout");
}

export async function togglePublished(id: string, published: boolean) {
  await requireAdmin();
  const project = await prisma.project.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "Project",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} project "${project.name}"`,
  });
  revalidatePublicProjectPages();
  revalidatePath("/admin/projects", "layout");
}

// --- Inventory (individual plots / units within a project) ---

async function revalidateInventoryPages(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  revalidatePath("/admin/projects", "layout");
  // "layout" also covers the plot layout pages under /projects/[slug]/plots.
  if (project) revalidatePath(`/projects/${project.slug}`, "layout");
}

const CELL_TAKEN = "That spot on the layout already has a plot.";

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// A plot placed on a layout must belong to a category of the same
// project, sit inside that category's grid, and have a number not used
// by another plot of that category (numbers repeat across categories).
async function placementError(
  projectId: string,
  data: { code: string; groupId?: string; gridRow: number | null; gridCol: number | null },
  excludeId?: string
): Promise<InventoryItemFormState | null> {
  if (!data.groupId) return null;
  const group = await prisma.plotGroup.findUnique({ where: { id: data.groupId } });
  if (!group || group.projectId !== projectId) return { fieldErrors: { groupId: "Choose a category." } };
  if (data.gridRow! > group.rows) return { fieldErrors: { gridRow: `This layout has ${group.rows} rows.` } };
  if (data.gridCol! > group.columns) return { fieldErrors: { gridCol: `This layout has ${group.columns} columns.` } };
  const twin = await prisma.inventoryItem.findFirst({
    where: { groupId: group.id, code: data.code, ...(excludeId && { id: { not: excludeId } }) },
    select: { id: true },
  });
  if (twin) return { fieldErrors: { code: `"${group.name}" already has plot ${data.code}.` } };
  return null;
}

export async function createInventoryItem(
  projectId: string,
  _prevState: InventoryItemFormState,
  formData: FormData
): Promise<InventoryItemFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = inventoryItemFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: InventoryItemFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const placement = await placementError(projectId, data);
  if (placement) return placement;

  let item;
  try {
    item = await prisma.inventoryItem.create({
      data: { projectId, ...inventoryItemData(data) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { gridCol: CELL_TAKEN } };
    throw error;
  }

  await logActivity({
    action: "created",
    resource: "InventoryItem",
    resourceId: item.id,
    description: `Added inventory item "${item.code}"`,
  });

  await revalidateInventoryPages(projectId);
  return { success: true };
}

export async function updateInventoryItem(
  id: string,
  _prevState: InventoryItemFormState,
  formData: FormData
): Promise<InventoryItemFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = inventoryItemFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: InventoryItemFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) return { error: "Item not found." };

  const placement = await placementError(existing.projectId, data, id);
  if (placement) return placement;

  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: inventoryItemData(data),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { gridCol: CELL_TAKEN } };
    throw error;
  }

  await logActivity({
    action: "updated",
    resource: "InventoryItem",
    resourceId: id,
    description: `Updated inventory item "${data.code}"`,
  });

  await revalidateInventoryPages(existing.projectId);
  return { success: true };
}

export async function deleteInventoryItem(id: string) {
  await requireAdmin();
  const item = await prisma.inventoryItem.delete({ where: { id } }).catch(() => null);
  if (item) {
    await logActivity({
      action: "deleted",
      resource: "InventoryItem",
      resourceId: id,
      description: `Deleted inventory item "${item.code}"`,
    });
    await revalidateInventoryPages(item.projectId);
  }
}

// Bulk delete from the "All plots" list: the rows the admin ticked.
// Limited to this project so a stale selection can't reach elsewhere.
export async function deleteInventoryItems(projectId: string, ids: string[]) {
  await requireAdmin();
  if (ids.length === 0) return { error: "Nothing selected." };
  const { count } = await prisma.inventoryItem.deleteMany({ where: { projectId, id: { in: ids } } });
  if (count === 0) return { error: "Those were already deleted." };

  await logActivity({
    action: "deleted",
    resource: "InventoryItem",
    resourceId: projectId,
    description: `Deleted ${count} inventory items`,
  });
  await revalidateInventoryPages(projectId);
  return { message: `${count} deleted.` };
}

// Delete by number range across the whole project (any category, or
// none). Booked/sold plots and ones with buyer info are kept unless
// `includeBooked` is set.
export async function deleteInventoryRange(
  projectId: string,
  // groupId: a category id, "unplaced" (not on any layout) or "" for all.
  input: { range: string; prefix: string; includeBooked: boolean; groupId: string }
) {
  await requireAdmin();

  const range = parseRange(input.range);
  if ("error" in range) return { error: range.error };

  const prefix = input.prefix.trim();
  const wanted: string[] = [];
  for (let n = range.from; n <= range.to; n++) wanted.push(prefix + String(n).padStart(range.pad, "0"));

  const inRange = await prisma.inventoryItem.findMany({
    where: {
      projectId,
      code: { in: wanted },
      ...(input.groupId === "unplaced" ? { groupId: null } : input.groupId ? { groupId: input.groupId } : {}),
    },
    select: { id: true, status: true, clientName: true, fileNumber: true, paymentMode: true },
  });
  if (inRange.length === 0) return { error: "No plots with those numbers." };
  const deletable = input.includeBooked
    ? inRange
    : inRange.filter((p) => p.status === "available" && !p.clientName && !p.fileNumber && !p.paymentMode);
  if (deletable.length === 0) return { error: "Every plot in that range is booked or sold — nothing deleted." };

  await prisma.inventoryItem.deleteMany({ where: { id: { in: deletable.map((p) => p.id) } } });

  await logActivity({
    action: "deleted",
    resource: "InventoryItem",
    resourceId: projectId,
    description: `Deleted ${deletable.length} plots (${prefix}${input.range.trim()})`,
  });
  await revalidateInventoryPages(projectId);

  const kept = inRange.length - deletable.length;
  return { message: `${deletable.length} deleted.${kept ? ` ${kept} booked/sold were kept.` : ""}` };
}

export async function updateInventoryItemStatus(id: string, status: InventoryStatus) {
  await requireAdmin();
  const item = await prisma.inventoryItem.update({ where: { id }, data: { status } });
  await logActivity({
    action: "updated",
    resource: "InventoryItem",
    resourceId: id,
    description: `Changed inventory item "${item.code}"'s status to ${status}`,
  });
  await revalidateInventoryPages(item.projectId);
}

// Layout editor "quick add": clicking an empty cell creates an available
// plot there with the next number, without opening the full form.
export async function quickAddPlot(groupId: string, gridRow: number, gridCol: number, code: string) {
  await requireAdmin();
  const trimmed = code.trim();
  if (!trimmed) return { error: "Enter a plot number." };

  const group = await prisma.plotGroup.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Category not found." };
  if (gridRow < 1 || gridCol < 1 || gridRow > group.rows || gridCol > group.columns) {
    return { error: "That spot is outside the layout." };
  }
  if (await prisma.inventoryItem.findFirst({ where: { groupId, code: trimmed }, select: { id: true } })) {
    return { error: `"${group.name}" already has plot ${trimmed}.` };
  }

  try {
    const item = await prisma.inventoryItem.create({
      data: { projectId: group.projectId, code: trimmed, status: "available", groupId, gridRow, gridCol },
    });
    await logActivity({
      action: "created",
      resource: "InventoryItem",
      resourceId: item.id,
      description: `Added plot "${item.code}" to "${group.name}"`,
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: CELL_TAKEN };
    throw error;
  }

  await revalidateInventoryPages(group.projectId);
  return { message: `Plot ${trimmed} added.` };
}

// Layout editor "add range": creates plots `from`…`to` (e.g. 1-532) in
// one go, placed into the category's empty cells — see planRangeFill.
// Numbers the project already has are skipped, not duplicated.
class LayoutChanged extends Error {}

export async function addPlotRange(
  groupId: string,
  input: { range: string; prefix: string; size: string; block: string; skipRows: string; skipCols: string }
) {
  await requireAdmin();

  const range = parseRange(input.range);
  if ("error" in range) return { error: range.error };

  const group = await prisma.plotGroup.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Category not found." };

  const [projectPlots, occupied] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { projectId: group.projectId },
      select: { id: true, code: true, groupId: true, size: true },
    }),
    prisma.inventoryItem.findMany({ where: { groupId }, select: { gridRow: true, gridCol: true } }),
  ]);
  // Numbers only clash within this category; matching plots that aren't
  // on any layout (e.g. their category was deleted) are placed instead
  // of created again.
  const { existingCodes, unplaced } = rangeCodeSets(projectPlots, groupId, input.size);
  const unplacedIds = new Map<string, string>();
  for (const plot of unplaced) {
    if (!unplacedIds.has(plot.code)) unplacedIds.set(plot.code, plot.id);
  }

  const plan = planRangeFill({
    ...range,
    prefix: input.prefix.trim(),
    existingCodes,
    unplacedCodes: new Set(unplacedIds.keys()),
    occupied,
    rows: group.rows,
    columns: group.columns,
    skipRows: parseNumberList(input.skipRows),
    skipCols: parseNumberList(input.skipCols),
    maxRows: MAX_GRID,
  });
  if ("error" in plan) return { error: plan.error };
  if (plan.placements.length === 0) return { error: "All of those plot numbers are already in this category." };

  const size = input.size.trim() || null;
  const block = input.block.trim() || null;
  const created = plan.placements.filter((p) => !p.existing);
  const moved = plan.placements.filter((p) => p.existing);
  try {
    await prisma.$transaction(async (tx) => {
      if (plan.rows > group.rows) await tx.plotGroup.update({ where: { id: groupId }, data: { rows: plan.rows } });
      if (created.length > 0) {
        await tx.inventoryItem.createMany({
          data: created.map((p) => ({
            projectId: group.projectId,
            groupId,
            code: p.code,
            gridRow: p.gridRow,
            gridCol: p.gridCol,
            status: "available" as const,
            size,
            block,
          })),
        });
      }
      if (moved.length > 0) {
        // One statement for the lot — keeps their status and buyer info.
        const ids = moved.map((p) => unplacedIds.get(p.code)!);
        const count = await tx.$executeRaw`
          UPDATE "InventoryItem" AS i
          SET "groupId" = ${groupId}, "gridRow" = v.r, "gridCol" = v.c
          FROM unnest(${ids}::text[], ${moved.map((p) => p.gridRow)}::int[], ${moved.map((p) => p.gridCol)}::int[]) AS v(id, r, c)
          WHERE i.id = v.id AND i."groupId" IS NULL`;
        if (count !== moved.length) throw new LayoutChanged();
      }
    }, { timeout: 30_000 });
  } catch (error) {
    // Someone changed the layout meanwhile — nothing was saved.
    if (isUniqueViolation(error) || error instanceof LayoutChanged) {
      return { error: "The layout changed while saving. Please try again." };
    }
    throw error;
  }

  await logActivity({
    action: "created",
    resource: "InventoryItem",
    resourceId: groupId,
    description: `Added ${created.length} and placed ${moved.length} plots (${input.range.trim()}) on "${group.name}"`,
  });
  await revalidateInventoryPages(group.projectId);

  const notes = [
    created.length ? `${created.length} plots added.` : "",
    moved.length ? `${moved.length} existing plots placed on the layout.` : "",
    plan.skipped ? `${plan.skipped} are already in this category and were skipped.` : "",
    plan.rows > group.rows ? `Layout grew to ${plan.rows} rows.` : "",
  ];
  return { message: notes.filter(Boolean).join(" ") };
}

// Undo for a mistaken range: deletes plots `from`…`to` of this category,
// but only ones still available with no buyer info — booked/sold plots
// are never removed in bulk.
export async function deletePlotRange(groupId: string, input: { range: string; prefix: string }) {
  await requireAdmin();

  const range = parseRange(input.range);
  if ("error" in range) return { error: range.error };

  const group = await prisma.plotGroup.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Category not found." };

  const prefix = input.prefix.trim();
  const wanted = new Set<string>();
  for (let n = range.from; n <= range.to; n++) wanted.add(prefix + String(n).padStart(range.pad, "0"));

  const plots = await prisma.inventoryItem.findMany({
    where: { groupId },
    select: { id: true, code: true, status: true, clientName: true, fileNumber: true, paymentMode: true },
  });
  const inRange = plots.filter((p) => wanted.has(p.code));
  const deletable = inRange.filter((p) => p.status === "available" && !p.clientName && !p.fileNumber && !p.paymentMode);
  if (deletable.length === 0) return { error: "No free plots in that range to delete." };

  await prisma.inventoryItem.deleteMany({ where: { id: { in: deletable.map((p) => p.id) } } });

  await logActivity({
    action: "deleted",
    resource: "InventoryItem",
    resourceId: groupId,
    description: `Deleted ${deletable.length} plots (${input.range.trim()}) from "${group.name}"`,
  });
  await revalidateInventoryPages(group.projectId);

  const kept = inRange.length - deletable.length;
  return {
    message: `${deletable.length} plots deleted.${kept ? ` ${kept} booked/sold plots were kept.` : ""}`,
  };
}

// --- Plot categories (layout pages: ৩ কাঠা, বাণিজ্যিক, …) ---

function parsePlotGroupForm(formData: FormData) {
  const parsed = plotGroupFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (parsed.success) return { ok: true as const, data: parsed.data };
  const fieldErrors: PlotGroupFormState["fieldErrors"] = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof typeof fieldErrors;
    if (key) fieldErrors[key] = issue.message;
  }
  return { ok: false as const, state: { fieldErrors } };
}

const SLUG_TAKEN: PlotGroupFormState = { fieldErrors: { slug: "Another category of this project uses this slug." } };

export async function createPlotGroup(
  projectId: string,
  _prevState: PlotGroupFormState,
  formData: FormData
): Promise<PlotGroupFormState> {
  await requireAdmin();
  const parsed = parsePlotGroupForm(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  const last = await prisma.plotGroup.findFirst({ where: { projectId }, orderBy: { order: "desc" } });
  try {
    const group = await prisma.plotGroup.create({
      data: { projectId, ...data, description: data.description || null, order: (last?.order ?? -1) + 1 },
    });
    await logActivity({
      action: "created",
      resource: "PlotGroup",
      resourceId: group.id,
      description: `Added plot category "${group.name}"`,
    });
  } catch (error) {
    if (isUniqueViolation(error)) return SLUG_TAKEN;
    throw error;
  }

  await revalidateInventoryPages(projectId);
  return { success: true };
}

export async function updatePlotGroup(
  id: string,
  _prevState: PlotGroupFormState,
  formData: FormData
): Promise<PlotGroupFormState> {
  await requireAdmin();
  const parsed = parsePlotGroupForm(formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;

  const existing = await prisma.plotGroup.findUnique({ where: { id } });
  if (!existing) return { error: "Category not found." };

  // Shrinking the grid must not cut off plots already placed there.
  const outside = await prisma.inventoryItem.count({
    where: { groupId: id, OR: [{ gridRow: { gt: data.rows } }, { gridCol: { gt: data.columns } }] },
  });
  if (outside > 0) {
    const plots = outside === 1 ? "1 plot is" : `${outside} plots are`;
    return { error: `${plots} outside the new size. Move or remove them first.` };
  }

  try {
    await prisma.plotGroup.update({
      where: { id },
      data: { ...data, description: data.description || null },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return SLUG_TAKEN;
    throw error;
  }

  await logActivity({
    action: "updated",
    resource: "PlotGroup",
    resourceId: id,
    description: `Updated plot category "${data.name}"`,
  });
  await revalidateInventoryPages(existing.projectId);
  return { success: true };
}

// Deleting a category keeps its plots (with their buyer info) — they
// just come off the layout and can be placed again later.
export async function deletePlotGroup(id: string) {
  await requireAdmin();
  const group = await prisma.plotGroup.findUnique({ where: { id } });
  if (!group) return;

  await prisma.$transaction([
    prisma.inventoryItem.updateMany({
      where: { groupId: id },
      data: { groupId: null, gridRow: null, gridCol: null },
    }),
    prisma.plotGroup.delete({ where: { id } }),
  ]);

  await logActivity({
    action: "deleted",
    resource: "PlotGroup",
    resourceId: id,
    description: `Deleted plot category "${group.name}"`,
  });
  await revalidateInventoryPages(group.projectId);
}

export async function movePlotGroup(id: string, direction: "up" | "down") {
  await requireAdmin();

  const current = await prisma.plotGroup.findUnique({ where: { id } });
  if (!current) return;

  const groups = await prisma.plotGroup.findMany({
    where: { projectId: current.projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = groups.findIndex((g) => g.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= groups.length) return;

  // Re-number everything, so groups that share an order value still swap.
  const reordered = [...groups];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  await prisma.$transaction(
    reordered.map((g, i) => prisma.plotGroup.update({ where: { id: g.id }, data: { order: i } }))
  );

  await revalidateInventoryPages(current.projectId);
}

// --- Payment Plans ---

export async function createPaymentPlan(
  projectId: string,
  _prevState: PaymentPlanFormState,
  formData: FormData
): Promise<PaymentPlanFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentPlanFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: PaymentPlanFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const plan = await prisma.paymentPlan.create({
    data: {
      projectId,
      name: data.name,
      bookingAmount: data.bookingAmount || null,
      downPayment: data.downPayment || null,
      installmentInfo: data.installmentInfo || null,
      description: data.description || null,
    },
  });

  await logActivity({
    action: "created",
    resource: "PaymentPlan",
    resourceId: plan.id,
    description: `Added payment plan "${plan.name}"`,
  });

  await revalidateInventoryPages(projectId);
  return { success: true };
}

export async function updatePaymentPlan(
  id: string,
  _prevState: PaymentPlanFormState,
  formData: FormData
): Promise<PaymentPlanFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentPlanFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: PaymentPlanFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.paymentPlan.findUnique({ where: { id } });
  if (!existing) return { error: "Payment plan not found." };

  await prisma.paymentPlan.update({
    where: { id },
    data: {
      name: data.name,
      bookingAmount: data.bookingAmount || null,
      downPayment: data.downPayment || null,
      installmentInfo: data.installmentInfo || null,
      description: data.description || null,
    },
  });

  await logActivity({
    action: "updated",
    resource: "PaymentPlan",
    resourceId: id,
    description: `Updated payment plan "${data.name}"`,
  });

  await revalidateInventoryPages(existing.projectId);
  return { success: true };
}

export async function deletePaymentPlan(id: string) {
  await requireAdmin();
  const plan = await prisma.paymentPlan.delete({ where: { id } }).catch(() => null);
  if (plan) {
    await logActivity({
      action: "deleted",
      resource: "PaymentPlan",
      resourceId: id,
      description: `Deleted payment plan "${plan.name}"`,
    });
    await revalidateInventoryPages(plan.projectId);
  }
}

export async function togglePaymentPlanEnabled(id: string, enabled: boolean) {
  await requireAdmin();
  const plan = await prisma.paymentPlan.update({ where: { id }, data: { enabled } });
  await logActivity({
    action: enabled ? "published" : "unpublished",
    resource: "PaymentPlan",
    resourceId: id,
    description: `${enabled ? "Enabled" : "Disabled"} payment plan "${plan.name}"`,
  });
  await revalidateInventoryPages(plan.projectId);
}

// --- Project FAQs ---

export async function createProjectFaq(
  projectId: string,
  _prevState: ProjectFaqFormState,
  formData: FormData
): Promise<ProjectFaqFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = projectFaqFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ProjectFaqFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const last = await prisma.projectFaq.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const faq = await prisma.projectFaq.create({
    data: {
      projectId,
      question: data.question,
      answer: data.answer,
      order: nextOrder,
    },
  });

  await logActivity({
    action: "created",
    resource: "ProjectFaq",
    resourceId: faq.id,
    description: `Added FAQ "${faq.question}"`,
  });

  await revalidateInventoryPages(projectId);
  return { success: true };
}

export async function updateProjectFaq(
  id: string,
  _prevState: ProjectFaqFormState,
  formData: FormData
): Promise<ProjectFaqFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = projectFaqFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ProjectFaqFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.projectFaq.findUnique({ where: { id } });
  if (!existing) return { error: "FAQ not found." };

  await prisma.projectFaq.update({
    where: { id },
    data: {
      question: data.question,
      answer: data.answer,
    },
  });

  await logActivity({
    action: "updated",
    resource: "ProjectFaq",
    resourceId: id,
    description: `Updated FAQ "${data.question}"`,
  });

  await revalidateInventoryPages(existing.projectId);
  return { success: true };
}

export async function deleteProjectFaq(id: string) {
  await requireAdmin();
  const faq = await prisma.projectFaq.delete({ where: { id } }).catch(() => null);
  if (faq) {
    await logActivity({
      action: "deleted",
      resource: "ProjectFaq",
      resourceId: id,
      description: `Deleted FAQ "${faq.question}"`,
    });
    await revalidateInventoryPages(faq.projectId);
  }
}

export async function toggleProjectFaqPublished(id: string, published: boolean) {
  await requireAdmin();
  const faq = await prisma.projectFaq.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "ProjectFaq",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} FAQ "${faq.question}"`,
  });
  await revalidateInventoryPages(faq.projectId);
}

export async function moveProjectFaq(id: string, direction: "up" | "down") {
  await requireAdmin();

  const current = await prisma.projectFaq.findUnique({ where: { id } });
  if (!current) return;

  const faqs = await prisma.projectFaq.findMany({
    where: { projectId: current.projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = faqs.findIndex((f) => f.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= faqs.length) return;

  const neighbor = faqs[swapIndex];

  await prisma.$transaction([
    prisma.projectFaq.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.projectFaq.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  await revalidateInventoryPages(current.projectId);
}

// --- Page sections (amenities, key features, floor plans, …) ---

function parseSectionItemForm(section: ProjectItemSection, formData: FormData) {
  const config = PROJECT_SECTIONS[section];
  const parsed = projectSectionItemFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: ProjectSectionItemFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false as const, state: { fieldErrors } };
  }
  const data = parsed.data;
  const rawImageUrl = data.imageUrl?.trim() ?? "";
  return {
    ok: true as const,
    values: {
      title: data.title,
      description: config.description ? data.description ?? "" : "",
      icon: config.icon ? data.icon ?? "home" : "home",
      imageUrl: config.image !== "none" && isPlausibleImageUrl(rawImageUrl) ? rawImageUrl : null,
      tab: config.tabs?.some((t) => t.value === data.tab) ? data.tab! : config.tabs ? config.tabs[0].value : null,
    },
  };
}

export async function createProjectSectionItem(
  projectId: string,
  section: ProjectItemSection,
  _prevState: ProjectSectionItemFormState,
  formData: FormData
): Promise<ProjectSectionItemFormState> {
  await requireAdmin();
  if (!(section in PROJECT_SECTIONS)) return { error: "Unknown section." };

  const result = parseSectionItemForm(section, formData);
  if (!result.ok) return result.state;
  const { values } = result;
  if (PROJECT_SECTIONS[section].image === "required" && !values.imageUrl) {
    return { fieldErrors: { imageUrl: "An image is required — please wait for it to finish uploading." } };
  }

  const last = await prisma.projectSectionItem.findFirst({
    where: { projectId, section },
    orderBy: { order: "desc" },
  });

  const item = await prisma.projectSectionItem.create({
    data: { projectId, section, order: (last?.order ?? -1) + 1, ...values },
  });

  await logActivity({
    action: "created",
    resource: "ProjectSectionItem",
    resourceId: item.id,
    description: `Added "${item.title}" to ${PROJECT_SECTIONS[section].label}`,
  });

  await revalidateInventoryPages(projectId);
  return { success: true };
}

export async function updateProjectSectionItem(
  id: string,
  _prevState: ProjectSectionItemFormState,
  formData: FormData
): Promise<ProjectSectionItemFormState> {
  await requireAdmin();

  const existing = await prisma.projectSectionItem.findUnique({ where: { id } });
  if (!existing) return { error: "Item not found." };

  const result = parseSectionItemForm(existing.section, formData);
  if (!result.ok) return result.state;
  const { imageUrl, ...values } = result.values;

  await prisma.projectSectionItem.update({
    where: { id },
    // An empty upload field means "keep the current image".
    data: { ...values, ...(imageUrl ? { imageUrl } : {}) },
  });

  if (imageUrl && existing.imageUrl) {
    await deleteImage(existing.imageUrl);
  }

  await logActivity({
    action: "updated",
    resource: "ProjectSectionItem",
    resourceId: id,
    description: `Updated "${values.title}" in ${PROJECT_SECTIONS[existing.section].label}`,
  });

  await revalidateInventoryPages(existing.projectId);
  return { success: true };
}

export async function deleteProjectSectionItem(id: string) {
  await requireAdmin();
  const item = await prisma.projectSectionItem.delete({ where: { id } }).catch(() => null);
  if (!item) return;
  if (item.imageUrl) await deleteImage(item.imageUrl);
  await logActivity({
    action: "deleted",
    resource: "ProjectSectionItem",
    resourceId: id,
    description: `Deleted "${item.title}" from ${PROJECT_SECTIONS[item.section].label}`,
  });
  await revalidateInventoryPages(item.projectId);
}

export async function toggleProjectSectionItemPublished(id: string, published: boolean) {
  await requireAdmin();
  const item = await prisma.projectSectionItem.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "ProjectSectionItem",
    resourceId: id,
    description: `${published ? "Published" : "Hid"} "${item.title}" in ${PROJECT_SECTIONS[item.section].label}`,
  });
  await revalidateInventoryPages(item.projectId);
}

export async function moveProjectSectionItem(id: string, direction: "up" | "down") {
  await requireAdmin();

  const current = await prisma.projectSectionItem.findUnique({ where: { id } });
  if (!current) return;

  const items = await prisma.projectSectionItem.findMany({
    where: { projectId: current.projectId, section: current.section },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = items.findIndex((item) => item.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  // Re-number the whole list so items that share an `order` value
  // (e.g. created in the same instant) still swap correctly.
  const reordered = [...items];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  await prisma.$transaction(
    reordered.map((item, order) => prisma.projectSectionItem.update({ where: { id: item.id }, data: { order } }))
  );

  await revalidateInventoryPages(current.projectId);
}
