import { prisma } from "@/lib/prisma";
import { mapBlogPost, blogPostWithCategory } from "@/lib/data/mapBlogPost";
import type { BlogPost } from "@/lib/types";

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: blogPostWithCategory,
  });
  return rows.map(mapBlogPost);
}

export async function getPostByIdAdmin(id: string): Promise<BlogPost | null> {
  const row = await prisma.blogPost.findUnique({
    where: { id },
    include: blogPostWithCategory,
  });
  return row ? mapBlogPost(row) : null;
}

export async function getBlogCounts() {
  const [total, published, unpublished] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.blogPost.count({ where: { published: false } }),
  ]);
  return { total, published, unpublished };
}

export async function getAllCategoriesAdmin() {
  return prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
}
