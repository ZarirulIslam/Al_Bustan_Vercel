"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import type { BlogPost } from "@/lib/types";
import type { BlogFormState } from "@/lib/admin/blogSchema";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toDateInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().slice(0, 10);
}

function SubmitButton({ label, disabledExtra }: { label: string; disabledExtra: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabledExtra}>
      {pending ? "Saving…" : disabledExtra ? "Waiting for upload…" : label}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

export function BlogForm({
  action,
  post,
  categories,
  submitLabel,
}: {
  action: (prevState: BlogFormState, formData: FormData) => Promise<BlogFormState>;
  post?: BlogPost;
  categories: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [addingCategory, setAddingCategory] = useState(categories.length === 0);
  const [imageUploading, setImageUploading] = useState(false);

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
          <input
            id="title"
            name="title"
            className={inputClass}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
          />
        </Field>

        <Field label="Slug" htmlFor="slug" error={state.fieldErrors?.slug}>
          <input
            id="slug"
            name="slug"
            className={inputClass}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            required
          />
        </Field>

        <Field label="Author" htmlFor="author" error={state.fieldErrors?.author}>
          <input
            id="author"
            name="author"
            className={inputClass}
            defaultValue={post?.author}
            placeholder="[Author placeholder]"
            required
          />
        </Field>

        <Field label="Publication Date" htmlFor="publishedAt" error={state.fieldErrors?.publishedAt}>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            className={inputClass}
            defaultValue={toDateInputValue(post?.publishedAt)}
            required
          />
        </Field>

        <Field label="Category" htmlFor="categoryId" error={state.fieldErrors?.categoryId}>
          {!addingCategory ? (
            <div className="space-y-2">
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={post?.category.id}
                className={inputClass}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="text-xs font-medium text-garden-700 hover:underline"
              >
                + New category instead
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                id="newCategoryName"
                name="newCategoryName"
                className={inputClass}
                placeholder="e.g. Design"
              />
              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddingCategory(false)}
                  className="text-xs font-medium text-garden-700 hover:underline"
                >
                  Choose an existing category instead
                </button>
              )}
            </div>
          )}
        </Field>
      </div>

      <Field label="Excerpt" htmlFor="excerpt" error={state.fieldErrors?.excerpt}>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          className={inputClass}
          defaultValue={post?.excerpt}
          placeholder="Short summary shown on blog cards"
          required
        />
      </Field>

      <Field label="Content" htmlFor="content" error={state.fieldErrors?.content}>
        <MarkdownEditor id="content" name="content" defaultValue={post?.content} required />
      </Field>

      <Field label="Featured Image" htmlFor="featuredImageFile">
        <CoverImageUploadField
          fieldName="featuredImageUrl"
          subdir="blog"
          existingUrl={post?.featuredImage.url}
          required={!post}
          onUploadingChange={setImageUploading}
        />
      </Field>

      <section className="space-y-5 rounded-lg border border-limestone-300 p-5">
        <div>
          <h2 className="text-lg">SEO</h2>
          <p className="mt-1 text-sm text-ink-soft">
            All optional — each falls back to the fields above when left blank.
          </p>
        </div>

        <Field label="SEO Title" htmlFor="seoTitle" error={state.fieldErrors?.seoTitle}>
          <input
            id="seoTitle"
            name="seoTitle"
            className={inputClass}
            defaultValue={post?.seoTitle ?? ""}
            placeholder={title || "Defaults to the post title"}
            maxLength={70}
          />
        </Field>

        <Field label="Meta Description" htmlFor="metaDescription" error={state.fieldErrors?.metaDescription}>
          <textarea
            id="metaDescription"
            name="metaDescription"
            rows={2}
            className={inputClass}
            defaultValue={post?.metaDescription ?? ""}
            placeholder="Defaults to the excerpt"
            maxLength={160}
          />
        </Field>

        <Field label="OG Image" htmlFor="ogImageFile">
          <CoverImageUploadField
            fieldName="ogImageUrl"
            subdir="blog"
            existingUrl={post?.ogImageUrl ?? undefined}
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Shown when this post is shared on social media. Defaults to the featured image above.
          </p>
        </Field>

        <Field label="Canonical URL" htmlFor="canonicalUrl" error={state.fieldErrors?.canonicalUrl}>
          <input
            id="canonicalUrl"
            name="canonicalUrl"
            className={inputClass}
            defaultValue={post?.canonicalUrl ?? ""}
            placeholder={`Defaults to /blog/${slug || "this-post"}`}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input type="checkbox" name="noIndex" defaultChecked={post?.noIndex ?? false} />
          Hide from search engines (noindex)
        </label>
      </section>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? false} />
        Published (visible on the public site)
      </label>

      <SubmitButton label={submitLabel} disabledExtra={imageUploading} />
    </form>
  );
}
