import { BlogTable } from "@/components/admin/BlogTable";
import { Button } from "@/components/ui/Button";
import { getAllPostsAdmin } from "@/lib/admin/blog";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await getAllPostsAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">Blog</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Write, edit, publish, and remove articles.
          </p>
        </div>
        <Button href="/admin/blog/new">Add Blog Post</Button>
      </div>

      <div className="mt-8">
        <BlogTable posts={posts} />
      </div>
    </div>
  );
}
