import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { BlogCard } from "@/components/ui/BlogCard";
import { proseMarkdownComponents } from "@/components/ui/markdownComponents";
import { getPostBySlug, getRelatedPosts } from "@/lib/data/blog";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const ogImage = post.ogImageUrl || post.featuredImage.url;

  return {
    title,
    description,
    alternates: {
      canonical: post.canonicalUrl || `/blog/${post.slug}`,
    },
    ...(post.noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post, 3);

  return (
    <>
      <Section className="pb-0 pt-16 md:pt-20">
        <Container>
          <Link href="/blog" className="text-sm font-medium text-garden-700 hover:underline">
            ← Back to Blog
          </Link>
          <p className="mt-6 text-sm text-brass">{post.category.name}</p>
          <h1 className="mt-3 max-w-3xl text-3xl md:text-5xl">{post.title}</h1>
          <p className="mt-4 text-sm text-ink-soft">
            By {post.author} · {formatDate(post.publishedAt)}
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div className="mx-auto mt-10 max-w-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={proseMarkdownComponents}>
              {post.content}
            </ReactMarkdown>
          </div>
        </Container>
      </Section>

      {relatedPosts.length > 0 && (
        <Section className="bg-limestone-200">
          <Container>
            <h2 className="text-2xl md:text-3xl">Related Articles</h2>
            <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <BlogCard key={related.id} post={related} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
