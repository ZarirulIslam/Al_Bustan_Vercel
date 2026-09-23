"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import { testimonialFormSchema, type TestimonialFormState } from "@/lib/admin/testimonialSchema";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated.");
}

// Photo is optional here (unlike blog's featured image), so this is
// only ever used to decide whether a submitted value looks like a
// real upload result worth saving — an empty string just means "no
// photo", not an error.
function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/");
}

function revalidateTestimonialPages() {
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
}

export async function createTestimonial(
  _prevState: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = testimonialFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: TestimonialFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const photoUrl = String(formData.get("photoUrl") || "");

  const last = await prisma.testimonial.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  const testimonial = await prisma.testimonial.create({
    data: {
      customerName: data.customerName,
      designation: data.designation?.trim() || null,
      text: data.text,
      projectId: data.projectId || null,
      photoUrl: isPlausibleImageUrl(photoUrl) ? photoUrl : null,
      published: data.published === "on",
      order: nextOrder,
    },
  });

  await logActivity({
    action: "created",
    resource: "Testimonial",
    resourceId: testimonial.id,
    description: `Added testimonial from "${testimonial.customerName}"`,
  });

  revalidateTestimonialPages();
  redirect("/admin/testimonials");
}

export async function updateTestimonial(
  id: string,
  _prevState: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = testimonialFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: TestimonialFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return { error: "Testimonial not found." };

  const rawPhotoUrl = String(formData.get("photoUrl") || "");
  const newPhotoUrl = isPlausibleImageUrl(rawPhotoUrl) ? rawPhotoUrl : undefined;

  await prisma.testimonial.update({
    where: { id },
    data: {
      customerName: data.customerName,
      designation: data.designation?.trim() || null,
      text: data.text,
      projectId: data.projectId || null,
      ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
      published: data.published === "on",
    },
  });

  if (newPhotoUrl && existing.photoUrl) {
    await deleteImage(existing.photoUrl);
  }

  await logActivity({
    action: "updated",
    resource: "Testimonial",
    resourceId: id,
    description: `Updated testimonial from "${data.customerName}"`,
  });

  revalidateTestimonialPages();
  redirect("/admin/testimonials");
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  const testimonial = await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  if (testimonial) {
    if (testimonial.photoUrl) await deleteImage(testimonial.photoUrl);
    await logActivity({
      action: "deleted",
      resource: "Testimonial",
      resourceId: id,
      description: `Deleted testimonial from "${testimonial.customerName}"`,
    });
  }
  revalidateTestimonialPages();
}

export async function toggleTestimonialPublished(id: string, published: boolean) {
  await requireAdmin();
  const testimonial = await prisma.testimonial.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "Testimonial",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} testimonial from "${testimonial.customerName}"`,
  });
  revalidateTestimonialPages();
}

// Same order-swap pattern as HeroSlide/ProjectFaq — swaps `order`
// with the immediate neighbor in the sorted list rather than
// renumbering everything.
export async function moveTestimonial(id: string, direction: "up" | "down") {
  await requireAdmin();

  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = testimonials.findIndex((t) => t.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= testimonials.length) return;

  const current = testimonials[index];
  const neighbor = testimonials[swapIndex];

  await prisma.$transaction([
    prisma.testimonial.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.testimonial.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidateTestimonialPages();
}
