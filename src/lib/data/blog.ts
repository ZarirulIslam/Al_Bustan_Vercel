import { prisma } from "@/lib/prisma";
import { mapBlogPost, blogPostWithCategory } from "@/lib/data/mapBlogPost";
import type { BlogCategory, BlogPost } from "@/lib/types";

// Public, published-only data access. Admin CRUD (including
// unpublished posts) lives in src/lib/admin/blog.ts.

export async function getLatestPosts(limit = 3): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: blogPostWithCategory,
  });
  return rows.map(mapBlogPost);
}

export async function getAllPublishedPosts(): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    include: blogPostWithCategory,
  });
  return rows.map(mapBlogPost);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const row = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: blogPostWithCategory,
  });
  return row ? mapBlogPost(row) : null;
}

export async function getPostsByCategorySlug(categorySlug: string): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { published: true, category: { slug: categorySlug } },
    orderBy: { publishedAt: "desc" },
    include: blogPostWithCategory,
  });
  return rows.map(mapBlogPost);
}

export async function searchPosts(query: string): Promise<BlogPost[]> {
  if (!query.trim()) return getAllPublishedPosts();

  const rows = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    include: blogPostWithCategory,
  });
  return rows.map(mapBlogPost);
}

export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: {
      published: true,
      id: { not: post.id },
      category: { slug: post.category.slug },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: blogPostWithCategory,
  });

  if (rows.length < limit) {
    const fillerRows = await prisma.blogPost.findMany({
      where: { published: true, id: { notIn: [post.id, ...rows.map((r) => r.id)] } },
      orderBy: { publishedAt: "desc" },
      take: limit - rows.length,
      include: blogPostWithCategory,
    });
    return [...rows, ...fillerRows].map(mapBlogPost);
  }

  return rows.map(mapBlogPost);
}

export async function getAllCategories(): Promise<BlogCategory[]> {
  const rows = await prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  return rows;
}
