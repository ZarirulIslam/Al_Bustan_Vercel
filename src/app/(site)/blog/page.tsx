import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { BlogCard } from "@/components/ui/BlogCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getAllPublishedPosts,
  getPostsByCategorySlug,
  searchPosts,
  getAllCategories,
} from "@/lib/data/blog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
};

export const revalidate = 0;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const isFiltered = Boolean(category || q);

  const [categories, posts] = await Promise.all([
    getAllCategories(),
    isFiltered
      ? q
        ? searchPosts(q)
        : getPostsByCategorySlug(category!)
      : getAllPublishedPosts(),
  ]);

  const featured = !isFiltered ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <Section className="pt-16 md:pt-20">
      <Container>
        <p className="text-sm text-brass">Blog</p>
        <h1 className="mt-3 max-w-xl text-4xl md:text-5xl">
          News, guides, and updates
        </h1>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                !category
                  ? "border-garden-500 bg-garden-500 text-white"
                  : "border-limestone-300 text-ink-soft hover:border-garden-300 hover:text-garden-700"
              )}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                  category === cat.slug
                    ? "border-garden-500 bg-garden-500 text-white"
                    : "border-limestone-300 text-ink-soft hover:border-garden-300 hover:text-garden-700"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <form action="/blog" method="get" className="flex w-full max-w-xs gap-2 sm:w-auto">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search articles…"
              className="w-full rounded border border-limestone-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-garden-500"
            />
          </form>
        </div>

        {posts.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No articles found"
              description="Try a different search term or browse all articles."
              action={
                <Link href="/blog" className="text-sm font-medium text-garden-700 hover:underline">
                  View all articles
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group mt-10 grid grid-cols-1 gap-6 overflow-hidden rounded-lg border border-limestone-300 bg-white shadow-card md:grid-cols-2"
              >
                <div className="relative aspect-[16/10] md:aspect-auto">
                  <Image
                    src={featured.featuredImage.url}
                    alt={featured.featuredImage.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-estate group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 md:p-10">
                  <p className="text-xs text-ink-soft">
                    {featured.category.name} · {formatDate(featured.publishedAt)}
                  </p>
                  <h2 className="mt-3 text-2xl md:text-3xl">{featured.title}</h2>
                  <p className="mt-3 text-ink-soft">{featured.excerpt}</p>
                  <span className="mt-5 inline-block text-sm font-medium text-garden-600">
                    Read More
                  </span>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}
