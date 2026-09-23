import type { BlogPost as PrismaBlogPost, BlogCategory as PrismaBlogCategory } from "@prisma/client";
import type { BlogPost } from "@/lib/types";

type PrismaBlogPostWithCategory = PrismaBlogPost & { category: PrismaBlogCategory };

export function mapBlogPost(p: PrismaBlogPostWithCategory): BlogPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    author: p.author,
    featuredImage: {
      id: `${p.id}-featured`,
      url: p.featuredImageUrl,
      alt: p.featuredImageAlt,
    },
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    published: p.published,
    publishedAt: p.publishedAt.toISOString(),
    seoTitle: p.seoTitle,
    metaDescription: p.metaDescription,
    ogImageUrl: p.ogImageUrl,
    canonicalUrl: p.canonicalUrl,
    noIndex: p.noIndex,
  };
}

export const blogPostWithCategory = {
  category: true,
} as const;
