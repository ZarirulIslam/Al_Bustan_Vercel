"use server";

import { revalidatePath } from "next/cache";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import { redirectWithFlash } from "@/lib/admin/flash";
import { blogFormSchema, type BlogFormState } from "@/lib/admin/blogSchema";

// As with the project actions, the featured image is uploaded
// directly from the browser to Supabase Storage before this action
// ever runs — see src/lib/uploadClient.ts. This action only ever
// receives the resulting URL as a plain string.

function isPlausibleImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/");
}

// Also enforces this admin's access to the section (see
// src/lib/admin/permissions.ts), not just that they're signed in.
async function requireAdmin() {
  await requireSectionAccess("blog");
}

function slugifyCategory(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function revalidateBlogPages() {
  revalidatePath("/");
  revalidatePath("/blog");
}

async function resolveCategoryId(formData: FormData): Promise<string | { error: string }> {
  const newCategoryName = String(formData.get("newCategoryName") || "").trim();

  if (newCategoryName) {
    const slug = slugifyCategory(newCategoryName);
    const existing = await prisma.blogCategory.findFirst({
      where: { OR: [{ name: newCategoryName }, { slug }] },
    });
    if (existing) return existing.id;

    const created = await prisma.blogCategory.create({
      data: { name: newCategoryName, slug },
    });
    return created.id;
  }

  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) return { error: "Choose or create a category." };
  return categoryId;
}

export async function createPost(
  _prevState: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = blogFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: BlogFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existingSlug = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    return { fieldErrors: { slug: "This slug is already in use." } };
  }

  const categoryResult = await resolveCategoryId(formData);
  if (typeof categoryResult !== "string") return categoryResult;

  const imageUrl = String(formData.get("featuredImageUrl") || "");
  if (!imageUrl || !isPlausibleImageUrl(imageUrl)) {
    return { error: "A featured image is required — please wait for it to finish uploading." };
  }

  const rawOgImageUrl = String(formData.get("ogImageUrl") || "");
  const ogImageUrl = isPlausibleImageUrl(rawOgImageUrl) ? rawOgImageUrl : null;

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      author: data.author,
      categoryId: categoryResult,
      featuredImageUrl: imageUrl,
      featuredImageAlt: data.title,
      published: data.published === "on",
      publishedAt: new Date(data.publishedAt),
      seoTitle: data.seoTitle?.trim() || null,
      metaDescription: data.metaDescription?.trim() || null,
      ogImageUrl,
      canonicalUrl: data.canonicalUrl?.trim() || null,
      noIndex: data.noIndex === "on",
    },
  });

  await logActivity({
    action: "created",
    resource: "BlogPost",
    resourceId: post.id,
    description: `Created blog post "${post.title}"`,
  });

  revalidateBlogPages();
  revalidatePath("/admin/blog");
  return redirectWithFlash("/admin/blog", `Blog post "${post.title}" created.`);
}

export async function updatePost(
  id: string,
  _prevState: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = blogFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: BlogFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return { error: "Post not found." };

  if (data.slug !== existing.slug) {
    const slugTaken = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return { fieldErrors: { slug: "This slug is already in use." } };
  }

  const categoryResult = await resolveCategoryId(formData);
  if (typeof categoryResult !== "string") return categoryResult;

  const rawImageUrl = String(formData.get("featuredImageUrl") || "");
  const imageUrl = isPlausibleImageUrl(rawImageUrl) ? rawImageUrl : undefined;

  const rawOgImageUrl = String(formData.get("ogImageUrl") || "");
  const ogImageUrl = isPlausibleImageUrl(rawOgImageUrl) ? rawOgImageUrl : undefined;

  await prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      author: data.author,
      categoryId: categoryResult,
      ...(imageUrl ? { featuredImageUrl: imageUrl, featuredImageAlt: data.title } : {}),
      ...(ogImageUrl ? { ogImageUrl } : {}),
      published: data.published === "on",
      publishedAt: new Date(data.publishedAt),
      seoTitle: data.seoTitle?.trim() || null,
      metaDescription: data.metaDescription?.trim() || null,
      canonicalUrl: data.canonicalUrl?.trim() || null,
      noIndex: data.noIndex === "on",
    },
  });

  if (imageUrl) {
    await deleteImage(existing.featuredImageUrl);
  }
  if (ogImageUrl && existing.ogImageUrl) {
    await deleteImage(existing.ogImageUrl);
  }

  await logActivity({
    action: "updated",
    resource: "BlogPost",
    resourceId: id,
    description: `Updated blog post "${data.title}"`,
  });

  revalidateBlogPages();
  revalidatePath("/admin/blog");
  return redirectWithFlash("/admin/blog", `Blog post "${data.title}" saved.`);
}

export async function deletePost(id: string) {
  await requireAdmin();
  const post = await prisma.blogPost.delete({ where: { id } }).catch(() => null);
  if (post) {
    await deleteImage(post.featuredImageUrl);
    if (post.ogImageUrl) await deleteImage(post.ogImageUrl);
    await logActivity({
      action: "deleted",
      resource: "BlogPost",
      resourceId: id,
      description: `Deleted blog post "${post.title}"`,
    });
  }
  revalidateBlogPages();
  revalidatePath("/admin/blog");
}

export async function togglePostPublished(id: string, published: boolean) {
  await requireAdmin();
  const post = await prisma.blogPost.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "BlogPost",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} blog post "${post.title}"`,
  });
  revalidateBlogPages();
  revalidatePath("/admin/blog");
}
