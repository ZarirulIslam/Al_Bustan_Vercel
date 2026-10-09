"use server";

import { revalidatePath } from "next/cache";
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
  inventoryItemFormSchema,
  type InventoryItemFormState,
} from "@/lib/admin/inventorySchema";
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
  if (project) revalidatePath(`/projects/${project.slug}`);
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

  const item = await prisma.inventoryItem.create({
    data: {
      projectId,
      code: data.code,
      status: data.status,
      size: data.size || null,
      facing: data.facing || null,
      price: data.price || null,
      block: data.block || null,
      roadWidth: data.roadWidth || null,
      floor: data.floor || null,
      bedrooms: data.bedrooms || null,
      bathrooms: data.bathrooms || null,
      parking: data.parking || null,
    },
  });

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

  await prisma.inventoryItem.update({
    where: { id },
    data: {
      code: data.code,
      status: data.status,
      size: data.size || null,
      facing: data.facing || null,
      price: data.price || null,
      block: data.block || null,
      roadWidth: data.roadWidth || null,
      floor: data.floor || null,
      bedrooms: data.bedrooms || null,
      bathrooms: data.bathrooms || null,
      parking: data.parking || null,
    },
  });

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
