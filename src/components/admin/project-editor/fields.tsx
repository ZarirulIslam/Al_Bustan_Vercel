"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import { GalleryImageUploadField } from "@/components/admin/GalleryImageUploadField";
import { BrochureUploadField } from "@/components/admin/BrochureUploadField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { galleryCategoriesFor } from "@/lib/projectSections";
import type { Project, ProjectCategory } from "@/lib/types";
import type { ProjectFormState } from "@/lib/admin/projectSchema";
import { cn } from "@/lib/utils";

// Field building blocks shared by the Land and Apartment project editors.
// Every input here belongs to the editor's single <form>, even when its
// step is hidden, so one Save submits the whole project.

export type FieldErrors = NonNullable<ProjectFormState["fieldErrors"]>;

export const inputClass =
  "w-full rounded-lg border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-garden-500 focus:ring-2 focus:ring-garden-100";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function TextInput({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  errors,
  required,
  type = "text",
  maxLength,
  className,
}: {
  name: keyof FieldErrors & string;
  label: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  hint?: string;
  errors?: FieldErrors;
  required?: boolean;
  type?: "text" | "number";
  maxLength?: number;
  className?: string;
}) {
  return (
    <Field
      label={label}
      htmlFor={name}
      error={errors?.[name]}
      hint={hint}
      className={className}
    >
      <input
        id={name}
        name={name}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        className={inputClass}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
      />
    </Field>
  );
}

export function TextArea({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  errors,
  required,
  rows = 3,
}: {
  name: keyof FieldErrors & string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  hint?: string;
  errors?: FieldErrors;
  required?: boolean;
  rows?: number;
}) {
  return (
    <Field label={label} htmlFor={name} error={errors?.[name]} hint={hint}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        className={inputClass}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
      />
    </Field>
  );
}

export function RichField({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  errors,
  size = "md",
  maxLength,
}: {
  name: keyof FieldErrors & string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  hint?: string;
  errors?: FieldErrors;
  size?: "sm" | "md";
  maxLength?: number;
}) {
  return (
    <Field label={label} htmlFor={name} error={errors?.[name]} hint={hint}>
      <RichTextEditor
        id={name}
        name={name}
        defaultValue={defaultValue ?? undefined}
        size={size}
        maxLength={maxLength}
        placeholder={placeholder}
        invalid={!!errors?.[name]}
      />
    </Field>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function NameSlugFields({
  project,
  errors,
}: {
  project?: Project;
  errors?: FieldErrors;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  return (
    <Grid>
      <Field label="Project Name" htmlFor="name" error={errors?.name}>
        <input
          id="name"
          name="name"
          className={inputClass}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
        />
      </Field>
      <Field
        label="URL Slug"
        htmlFor="slug"
        error={errors?.slug}
        hint={`/projects/${slug || "…"}`}
      >
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
    </Grid>
  );
}

export function StatusField({
  project,
  errors,
}: {
  project?: Project;
  errors?: FieldErrors;
}) {
  return (
    <Field
      label="Status"
      htmlFor="status"
      error={errors?.status}
      hint="Moves the project between the public Ongoing / Completed / Upcoming pages."
    >
      <select
        id="status"
        name="status"
        defaultValue={project?.status ?? "ongoing"}
        className={inputClass}
      >
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
        <option value="upcoming">Upcoming</option>
      </select>
    </Field>
  );
}

// Tracks which upload fields are busy so Save waits for them.
export function useUploadTracker() {
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const track = useCallback(
    (key: string) => (uploading: boolean) =>
      setBusy((prev) => {
        const next = new Set(prev);
        if (uploading) next.add(key);
        else next.delete(key);
        return next;
      }),
    [],
  );
  return { uploading: busy.size > 0, track };
}

export function ImageField({
  name,
  label,
  existingUrl,
  required,
  hint,
  onUploadingChange,
}: {
  name: "coverImageUrl" | "masterPlanUrl" | "ogImageUrl";
  label: string;
  existingUrl?: string | null;
  required?: boolean;
  hint?: string;
  onUploadingChange: (uploading: boolean) => void;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <CoverImageUploadField
        fieldName={name}
        subdir="projects"
        existingUrl={existingUrl ?? undefined}
        required={required}
        onUploadingChange={onUploadingChange}
      />
    </Field>
  );
}

export function BrochureField({
  project,
  hint,
  onUploadingChange,
}: {
  project?: Project;
  hint?: string;
  onUploadingChange: (uploading: boolean) => void;
}) {
  return (
    <Field label="Brochure (PDF)" htmlFor="brochureUrl" hint={hint}>
      <BrochureUploadField
        fieldName="brochureUrl"
        existingUrl={project?.brochureUrl}
        onUploadingChange={onUploadingChange}
      />
    </Field>
  );
}

const smallSelect =
  "w-full rounded border border-limestone-300 bg-white px-1.5 py-1 text-xs text-ink outline-none focus:border-garden-500";

export function GalleryField({
  project,
  category,
  withCategories = true,
  onUploadingChange,
}: {
  project?: Project;
  category: ProjectCategory;
  // Off for pages whose gallery has no filter tabs (apartments).
  withCategories?: boolean;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const categories = galleryCategoriesFor(category);
  return (
    <div className="space-y-6">
      {project && project.gallery.length > 0 && (
        <Field
          label={`Current photos (${project.gallery.length})`}
          htmlFor="_existingGallery"
          hint={
            withCategories
              ? "Pick a category for each photo — visitors can filter the gallery by them."
              : "Tick Remove to delete a photo on save."
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {project.gallery.map((img) => (
              <div key={img.id}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-limestone-300">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 640px) 20vw, 50vw"
                    className="object-cover"
                  />
                </div>
                {withCategories && (
                  <select
                    name={`galleryCategory:${img.id}`}
                    defaultValue={img.category ?? ""}
                    aria-label="Gallery category"
                    className={cn(smallSelect, "mt-1.5")}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.en}
                      </option>
                    ))}
                  </select>
                )}
                <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    name="removeGalleryImage"
                    value={img.id}
                  />
                  Remove
                </label>
              </div>
            ))}
          </div>
        </Field>
      )}

      <Field label="Add photos" htmlFor="galleryFiles">
        <GalleryImageUploadField
          fieldName="newGalleryImageUrls"
          subdir="projects"
          onUploadingChange={onUploadingChange}
        />
        {withCategories && (
          <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            Category for the new photos:
            <select
              name="newGalleryCategory"
              defaultValue=""
              className={cn(smallSelect, "w-auto px-2")}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.en}
                </option>
              ))}
            </select>
          </label>
        )}
      </Field>
    </div>
  );
}

export function VideoField({
  project,
  errors,
}: {
  project?: Project;
  errors?: FieldErrors;
}) {
  return (
    <Field
      label="YouTube videos"
      htmlFor="videoUrls"
      error={errors?.videoUrls}
      hint="One link per line. The first video is featured; the rest form a playlist."
    >
      <textarea
        id="videoUrls"
        name="videoUrls"
        rows={4}
        className={cn(inputClass, "font-mono text-xs")}
        defaultValue={project?.videoUrls.join("\n") ?? ""}
        placeholder={"https://www.youtube.com/watch?v=…\nhttps://youtu.be/…"}
      />
    </Field>
  );
}

export function MapFields({ project }: { project?: Project }) {
  return (
    <Grid>
      <TextInput
        name="latitude"
        label="Latitude"
        type="number"
        defaultValue={project?.latitude}
        placeholder="e.g. 23.8759"
      />
      <TextInput
        name="longitude"
        label="Longitude"
        type="number"
        defaultValue={project?.longitude}
        placeholder="e.g. 90.3795"
      />
    </Grid>
  );
}

export function SeoFields({
  project,
  errors,
  onUploadingChange,
}: {
  project?: Project;
  errors?: FieldErrors;
  onUploadingChange: (uploading: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <TextInput
        name="seoTitle"
        label="SEO title"
        defaultValue={project?.seoTitle}
        placeholder="Defaults to the project name"
        maxLength={70}
        errors={errors}
      />
      <TextArea
        name="metaDescription"
        label="Meta description"
        defaultValue={project?.metaDescription}
        placeholder="Defaults to the short description"
        errors={errors}
        rows={2}
      />
      <ImageField
        name="ogImageUrl"
        label="Social share image"
        existingUrl={project?.ogImageUrl}
        hint="Shown when the page is shared on social media. Defaults to the cover image."
        onUploadingChange={onUploadingChange}
      />
      <TextInput
        name="canonicalUrl"
        label="Canonical URL"
        defaultValue={project?.canonicalUrl}
        placeholder={`Defaults to /projects/${project?.slug ?? "this-project"}`}
        errors={errors}
      />
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="noIndex"
          defaultChecked={project?.noIndex ?? false}
        />
        Hide from search engines (noindex)
      </label>
    </div>
  );
}
