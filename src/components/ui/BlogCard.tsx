import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg shadow-card transition-shadow duration-300 ease-estate group-hover:shadow-card-hover">
        <Image
          src={post.featuredImage.url}
          alt={post.featuredImage.alt}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 ease-estate group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded bg-garden-700/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {post.category.name}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm text-ink-soft">{formatDate(post.publishedAt)}</p>
        <h3 className="mt-2 text-lg leading-snug">{post.title}</h3>
        <p className="mt-2.5 text-sm text-ink-soft">{post.excerpt}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-garden-600">
          Read More
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true" className="transition-transform duration-200 ease-estate group-hover:translate-x-1">
            <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
