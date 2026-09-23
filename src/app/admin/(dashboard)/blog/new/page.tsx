import { BlogForm } from "@/components/admin/BlogForm";
import { createPost } from "@/app/admin/(dashboard)/blog/actions";
import { getAllCategoriesAdmin } from "@/lib/admin/blog";

export default async function NewBlogPostPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div>
      <h1 className="text-3xl">Add Blog Post</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Write the article below, or save it unpublished as a draft.
      </p>

      <div className="mt-8 max-w-3xl">
        <BlogForm action={createPost} categories={categories} submitLabel="Publish / Save Post" />
      </div>
    </div>
  );
}
