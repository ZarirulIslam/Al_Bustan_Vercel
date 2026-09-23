"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { BlogPost } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deletePost, togglePostPublished } from "@/app/admin/(dashboard)/blog/actions";

export function BlogTable({ posts }: { posts: BlogPost[] }) {
  const [isPending, startTransition] = useTransition();

  if (posts.length === 0) {
    return (
      <EmptyState
        title="No articles yet"
        description='Click "Add Blog Post" to write the first one.'
        action={<Button href="/admin/blog/new">Add Blog Post</Button>}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3.5 font-semibold">Article</th>
            <th className="px-4 py-3.5 font-semibold">Category</th>
            <th className="px-4 py-3.5 font-semibold">Author</th>
            <th className="px-4 py-3.5 font-semibold">Published</th>
            <th className="px-4 py-3.5 font-semibold">Date</th>
            <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              className="border-b border-limestone-300 transition-colors duration-150 last:border-0 hover:bg-limestone-100/70"
            >
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-md border border-limestone-300">
                    <Image src={post.featuredImage.url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <span className="font-medium text-ink">{post.title}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-ink-soft">{post.category.name}</td>
              <td className="px-4 py-3.5 text-ink-soft">{post.author}</td>
              <td className="px-4 py-3.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => togglePostPublished(post.id, !post.published))
                  }
                  className={
                    post.published
                      ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                      : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                  }
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${post.published ? "bg-garden-500" : "bg-ink-soft/50"}`}
                  />
                  {post.published ? "Published" : "Draft"}
                </button>
              </td>
              <td className="px-4 py-3.5 text-ink-soft">
                {new Date(post.publishedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end gap-2">
                  <Button href={`/admin/blog/${post.id}/edit`} variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(`Delete "${post.title}"? This can't be undone.`)) {
                        startTransition(() => deletePost(post.id));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
