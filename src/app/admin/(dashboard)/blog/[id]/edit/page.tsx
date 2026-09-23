import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";
import { updatePost } from "@/app/admin/(dashboard)/blog/actions";
import { getPostByIdAdmin, getAllCategoriesAdmin } from "@/lib/admin/blog";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    getPostByIdAdmin(id),
    getAllCategoriesAdmin(),
  ]);
  if (!post) notFound();

  const boundUpdate = updatePost.bind(null, post.id);

  return (
    <div>
      <h1 className="text-3xl">Edit Blog Post</h1>
      <p className="mt-1 text-sm text-ink-soft">{post.title}</p>

      <div className="mt-8 max-w-3xl">
        <BlogForm action={boundUpdate} post={post} categories={categories} submitLabel="Save Changes" />
      </div>
    </div>
  );
}
