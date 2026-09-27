"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import { GalleryImageUploadField } from "@/components/admin/GalleryImageUploadField";
import { BrochureUploadField } from "@/components/admin/BrochureUploadField";
import type { Project, ProjectStatus, ProjectCategory } from "@/lib/types";
import type { ProjectFormState } from "@/lib/admin/projectSchema";
import { useActionFeedback } from "@/components/admin/AdminToaster";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SubmitButton({ label, disabledExtra }: { label: string; disabledExtra: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabledExtra}>
      {pending ? "Saving…" : disabledExtra ? "Waiting for uploads…" : label}
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

export function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  project?: Project;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "Project saved.");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [name, setName] = useState(project?.name ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [masterPlanUploading, setMasterPlanUploading] = useState(false);
  const [brochureUploading, setBrochureUploading] = useState(false);
  const [ogImageUploading, setOgImageUploading] = useState(false);
  const [category, setCategory] = useState<ProjectCategory>(project?.category ?? "land_plot");

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Project Name" htmlFor="name" error={state.fieldErrors?.name}>
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

        <Field label="Status" htmlFor="status" error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? ("ongoing" satisfies ProjectStatus)}
            className={inputClass}
          >
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </Field>

        <Field label="Category" htmlFor="category" error={state.fieldErrors?.category}>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            className={inputClass}
          >
            <option value="land_plot">Land / Plot</option>
            <option value="flat">Flat / Apartment</option>
          </select>
        </Field>

        <Field label="Location" htmlFor="location" error={state.fieldErrors?.location}>
          <input
            id="location"
            name="location"
            className={inputClass}
            defaultValue={project?.location}
            placeholder="[Location placeholder]"
            required
          />
        </Field>

        <Field label="Project Type" htmlFor="projectType" error={state.fieldErrors?.projectType}>
          <input
            id="projectType"
            name="projectType"
            className={inputClass}
            defaultValue={project?.projectType}
            placeholder="e.g. Residential"
            required
          />
        </Field>

        <Field label="Total Area" htmlFor="totalArea" error={state.fieldErrors?.totalArea}>
          <input
            id="totalArea"
            name="totalArea"
            className={inputClass}
            defaultValue={project?.totalArea}
            placeholder="[Total area placeholder]"
            required
          />
        </Field>

        <Field label="Unit / Plot Information" htmlFor="unitInfo" error={state.fieldErrors?.unitInfo}>
          <input
            id="unitInfo"
            name="unitInfo"
            className={inputClass}
            defaultValue={project?.unitInfo}
            placeholder="[Unit/plot information placeholder]"
            required
          />
        </Field>

        <Field label="Development Timeline" htmlFor="timeline" error={state.fieldErrors?.timeline}>
          <input
            id="timeline"
            name="timeline"
            className={inputClass}
            defaultValue={project?.timeline}
            placeholder="[Development timeline placeholder]"
            required
          />
        </Field>

        <Field label="Latitude (optional)" htmlFor="latitude">
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            className={inputClass}
            defaultValue={project?.latitude ?? ""}
          />
        </Field>

        <Field label="Longitude (optional)" htmlFor="longitude">
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            className={inputClass}
            defaultValue={project?.longitude ?? ""}
          />
        </Field>
      </div>

      <Field
        label="Short Description"
        htmlFor="shortDescription"
        error={state.fieldErrors?.shortDescription}
      >
        <textarea
          id="shortDescription"
          name="shortDescription"
          rows={2}
          className={inputClass}
          defaultValue={project?.shortDescription}
          required
        />
      </Field>

      <Field
        label="Full Description"
        htmlFor="fullDescription"
        error={state.fieldErrors?.fullDescription}
      >
        <RichTextEditor
          id="fullDescription"
          name="fullDescription"
          defaultValue={project?.fullDescription}
          size="md"
          invalid={!!state.fieldErrors?.fullDescription}
        />
      </Field>

      <Field label="Features" htmlFor="features" error={state.fieldErrors?.features}>
        <RichTextEditor
          id="features"
          name="features"
          defaultValue={project?.features}
          size="md"
          maxLength={3000}
          placeholder="Use a bulleted list — each bullet shows with a check mark on the project page."
          invalid={!!state.fieldErrors?.features}
        />
      </Field>

      <div>
        <h3 className="text-base text-ink">
          {category === "flat" ? "Flat details" : "Plot details"}
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label={category === "flat" ? "Total Flats (optional)" : "Total Plots (optional)"}
            htmlFor="totalUnits"
          >
            <input
              id="totalUnits"
              name="totalUnits"
              type="number"
              min="0"
              className={inputClass}
              defaultValue={project?.totalUnits ?? ""}
            />
          </Field>

          <Field
            label={category === "flat" ? "Available Flats (optional)" : "Available Plots (optional)"}
            htmlFor="availableUnits"
          >
            <input
              id="availableUnits"
              name="availableUnits"
              type="number"
              min="0"
              className={inputClass}
              defaultValue={project?.availableUnits ?? ""}
            />
          </Field>

          <Field
            label={category === "flat" ? "Sizes Offered (e.g. 1,200–2,400 sq ft)" : "Sizes Offered (e.g. 3, 5 & 10 Katha)"}
            htmlFor="sizesOffered"
          >
            <input
              id="sizesOffered"
              name="sizesOffered"
              className={inputClass}
              defaultValue={project?.sizesOffered ?? ""}
            />
          </Field>

          {category === "flat" && (
            <Field label="Bedroom Options (e.g. 3 & 4 bedroom units)" htmlFor="bedroomOptions">
              <input
                id="bedroomOptions"
                name="bedroomOptions"
                className={inputClass}
                defaultValue={project?.bedroomOptions ?? ""}
              />
            </Field>
          )}

          <Field label="Block (optional)" htmlFor="block" error={state.fieldErrors?.block}>
            <input
              id="block"
              name="block"
              className={inputClass}
              defaultValue={project?.block ?? ""}
              placeholder="e.g. Block C"
            />
          </Field>

          <Field label="Facing (optional)" htmlFor="facing" error={state.fieldErrors?.facing}>
            <input
              id="facing"
              name="facing"
              className={inputClass}
              defaultValue={project?.facing ?? ""}
              placeholder="e.g. South-facing"
            />
          </Field>

          <Field
            label="Front Road Width (optional)"
            htmlFor="frontRoadWidth"
            error={state.fieldErrors?.frontRoadWidth}
          >
            <input
              id="frontRoadWidth"
              name="frontRoadWidth"
              className={inputClass}
              defaultValue={project?.frontRoadWidth ?? ""}
              placeholder="e.g. 30 ft"
            />
          </Field>
        </div>
      </div>

      <Field label="Pricing / Payment Information (optional)" htmlFor="pricingInfo">
        <RichTextEditor
          id="pricingInfo"
          name="pricingInfo"
          defaultValue={project?.pricingInfo}
          size="sm"
          placeholder="Free text — e.g. instalment plans, booking amount. Leave blank if prices aren't finalized yet."
        />
      </Field>

      <Field label="Nearby Facilities (optional)" htmlFor="nearbyFacilities" error={state.fieldErrors?.nearbyFacilities}>
        <RichTextEditor
          id="nearbyFacilities"
          name="nearbyFacilities"
          defaultValue={project?.nearbyFacilities}
          size="md"
          maxLength={3000}
          placeholder="e.g. a bulleted list: 15 km from Kuril Flyover, near XYZ University…"
          invalid={!!state.fieldErrors?.nearbyFacilities}
        />
      </Field>

      <Field label="Master Plan Image (optional)" htmlFor="masterPlanFile">
        <CoverImageUploadField
          fieldName="masterPlanUrl"
          subdir="projects"
          existingUrl={project?.masterPlanUrl ?? undefined}
          onUploadingChange={setMasterPlanUploading}
        />
      </Field>

      <Field label="Brochure (PDF, optional)" htmlFor="brochureFile">
        <BrochureUploadField
          fieldName="brochureUrl"
          existingUrl={project?.brochureUrl}
          onUploadingChange={setBrochureUploading}
        />
      </Field>

      <Field label="Cover Image" htmlFor="coverImageFile">
        <CoverImageUploadField
          fieldName="coverImageUrl"
          subdir="projects"
          existingUrl={project?.coverImage.url}
          required={!project}
          onUploadingChange={setCoverUploading}
        />
      </Field>

      {project && project.gallery.length > 0 && (
        <Field label="Existing Gallery Images" htmlFor="_existingGallery">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {project.gallery.map((img) => (
              <label key={img.id} className="group relative block cursor-pointer">
                <div className="relative aspect-square overflow-hidden rounded border border-limestone-300">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 640px) 25vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" name="removeGalleryImage" value={img.id} />
                  Remove
                </span>
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Add Gallery Images" htmlFor="galleryFiles">
        <GalleryImageUploadField
          fieldName="newGalleryImageUrls"
          subdir="projects"
          onUploadingChange={setGalleryUploading}
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
            defaultValue={project?.seoTitle ?? ""}
            placeholder={name || "Defaults to the project name"}
            maxLength={70}
          />
        </Field>

        <Field label="Meta Description" htmlFor="metaDescription" error={state.fieldErrors?.metaDescription}>
          <textarea
            id="metaDescription"
            name="metaDescription"
            rows={2}
            className={inputClass}
            defaultValue={project?.metaDescription ?? ""}
            placeholder="Defaults to the short description"
            maxLength={160}
          />
        </Field>

        <Field label="OG Image" htmlFor="ogImageFile">
          <CoverImageUploadField
            fieldName="ogImageUrl"
            subdir="projects"
            existingUrl={project?.ogImageUrl ?? undefined}
            onUploadingChange={setOgImageUploading}
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Shown when this project is shared on social media. Defaults to the cover image above.
          </p>
        </Field>

        <Field label="Canonical URL" htmlFor="canonicalUrl" error={state.fieldErrors?.canonicalUrl}>
          <input
            id="canonicalUrl"
            name="canonicalUrl"
            className={inputClass}
            defaultValue={project?.canonicalUrl ?? ""}
            placeholder={`Defaults to /projects/${slug || "this-project"}`}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input type="checkbox" name="noIndex" defaultChecked={project?.noIndex ?? false} />
          Hide from search engines (noindex)
        </label>
      </section>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="published"
          defaultChecked={project?.published ?? false}
        />
        Published (visible on the public site)
      </label>

      <SubmitButton
        label={submitLabel}
        disabledExtra={
          coverUploading || galleryUploading || masterPlanUploading || brochureUploading || ogImageUploading
        }
      />
    </form>
  );
}
