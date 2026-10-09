"use client";

import { useActionState, useEffect, useState } from "react";
import { SectionItemsManager } from "@/components/admin/SectionItemsManager";
import { useActionFeedback } from "@/components/admin/AdminToaster";
import { EditorShell, type EditorStep } from "@/components/admin/project-editor/EditorShell";
import { LockedNote } from "@/components/admin/project-editor/LandProjectEditor";
import {
  BrochureField,
  GalleryField,
  Grid,
  ImageField,
  NameSlugFields,
  SeoFields,
  StatusField,
  TextArea,
  TextInput,
  useUploadTracker,
} from "@/components/admin/project-editor/fields";
import type { ProjectFormState } from "@/lib/admin/projectSchema";
import type { ProjectSectionItemsBySection } from "@/lib/data/projectSectionItems";
import type { Project } from "@/lib/types";

// CMS editor for Flat / Apartment projects. It holds exactly what the
// apartment page shows (src/components/project/ApartmentProjectView.tsx),
// step by step in page order: Hero → Overview & Specification →
// Features & Amenities → Key Plan → Project Gallery → Featured projects.
// Fields the page doesn't use aren't here — and saving never clears
// them (see onlySubmitted in the project actions).
export function ApartmentProjectEditor({
  action,
  project,
  sections,
}: {
  action: (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  project?: Project;
  sections?: ProjectSectionItemsBySection;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  useActionFeedback(state, "Project saved.");
  const { uploading, track } = useUploadTracker();
  const [formKey, setFormKey] = useState(0);
  const e = state.fieldErrors;

  // Fresh form after a save, so already-saved uploads aren't resubmitted.
  useEffect(() => {
    if (state.success) setFormKey((k) => k + 1);
  }, [state]);

  const id = project?.id;
  const items = (section: keyof ProjectSectionItemsBySection, title: string) =>
    id && sections ? (
      <SectionItemsManager projectId={id} section={section} items={sections[section]} title={title} />
    ) : (
      <LockedNote />
    );

  const steps: EditorStep[] = [
    {
      id: "basics",
      group: "Setup",
      label: "Project basics",
      title: "Project basics",
      description: "Name, web address and status. The short description is used on project cards across the site.",
      fieldNames: ["name", "slug", "status", "shortDescription"],
      fields: (
        <>
          <input type="hidden" name="category" value="flat" />
          <NameSlugFields project={project} errors={e} />
          <StatusField project={project} errors={e} />
          <TextArea
            name="shortDescription"
            label="Short description (project cards)"
            defaultValue={project?.shortDescription}
            required
            rows={2}
            errors={e}
          />
        </>
      ),
    },
    {
      id: "hero",
      group: "Page sections",
      number: "01",
      label: "Hero",
      title: "Hero",
      description:
        "Photo slider (cover + gallery photos), PROJECT DETAILS pill, name, address, the line beside the status button, and the Floors · Units · Parking · Handover bar (filled from the Specification step).",
      fieldNames: ["location", "tagline"],
      fields: (
        <>
          <TextInput
            name="location"
            label="Address"
            defaultValue={project?.location}
            placeholder="e.g. Plot 24, Road 05, Sector 12, Uttara, Dhaka"
            hint="Shown under the name and as the Address tile in the specification."
            required
            errors={e}
          />
          <TextInput
            name="tagline"
            label="Line beside the status button"
            defaultValue={project?.tagline}
            placeholder="e.g. Elevated Living. Thoughtfully Designed."
            maxLength={160}
            errors={e}
          />
          <ImageField
            name="coverImageUrl"
            label="Cover photo"
            existingUrl={project?.coverImage.url}
            required={!project}
            hint="First slide of the hero and first image in the viewer. A tall building photo works best."
            onUploadingChange={track("cover")}
          />
        </>
      ),
    },
    {
      id: "specification",
      group: "Page sections",
      number: "02",
      label: "Overview & Specification",
      title: "Overview & Specification",
      description:
        "The TECHNICAL · Specification card beside the image viewer. Tiles appear in this order; an empty one is left out.",
      anchor: "overview",
      fieldNames: [
        "facing",
        "frontRoadWidth",
        "totalArea",
        "sizesOffered",
        "totalUnits",
        "parkingSpaces",
        "floors",
        "handoverDate",
        "lifts",
        "stairs",
        "projectType",
      ],
      fields: (
        <>
          <Grid>
            <TextInput name="facing" label="Orientation" defaultValue={project?.facing} placeholder="e.g. East Facing" errors={e} />
            <TextInput name="frontRoadWidth" label="Front Road" defaultValue={project?.frontRoadWidth} placeholder="e.g. 100 Feet" errors={e} />
            <TextInput name="totalArea" label="Land Size" defaultValue={project?.totalArea} placeholder="e.g. 5 katha" required errors={e} />
            <TextInput name="sizesOffered" label="Apartment Size" defaultValue={project?.sizesOffered} placeholder="e.g. 2700 sqft" errors={e} />
            <TextInput name="totalUnits" label="Apartments" type="number" defaultValue={project?.totalUnits} placeholder="e.g. 8" errors={e} />
            <TextInput name="parkingSpaces" label="Parking" defaultValue={project?.parkingSpaces} placeholder="e.g. 8" errors={e} />
            <TextInput name="floors" label="Floors" defaultValue={project?.floors} placeholder="e.g. G + 8" errors={e} />
            <TextInput name="handoverDate" label="Handover" defaultValue={project?.handoverDate} placeholder="e.g. 2027-12-31" errors={e} />
            <TextInput name="lifts" label="Lifts" defaultValue={project?.lifts} placeholder="e.g. 1" errors={e} />
            <TextInput name="stairs" label="Stairs" defaultValue={project?.stairs} placeholder="e.g. 1" errors={e} />
            <TextInput name="projectType" label="Building Type" defaultValue={project?.projectType} placeholder="e.g. Residential" required errors={e} />
          </Grid>
          <p className="text-xs text-ink-soft">The Address tile uses the address from the Hero step.</p>
          <BrochureField project={project} hint="Shows the “Download Brochure” button under the card." onUploadingChange={track("brochure")} />
        </>
      ),
    },
    {
      id: "amenities",
      group: "Page sections",
      number: "03",
      label: "Features & Amenities",
      title: "Features & Amenities",
      description: "Icon tiles under “WHAT WE OFFER” — e.g. Grand Waiting Lounge, Gymnasium, Rooftop Infinity Pool.",
      count: sections?.amenity.length,
      extra: items("amenity", "Amenities"),
    },
    {
      id: "keyplan",
      group: "Page sections",
      number: "04",
      label: "Key Plan",
      title: "Key Plan",
      description: "One drawing per floor — e.g. Basement, Ground Floor, Typical Floor, Roof Floor. Visitors switch with the buttons.",
      count: sections?.floor_plan.length,
      extra: items("floor_plan", "Floor plans"),
    },
    {
      id: "gallery",
      group: "Page sections",
      number: "05",
      label: "Project Gallery",
      title: "Project Gallery",
      description: "Square photo grid. These photos also fill the hero slider and the image viewer.",
      count: project?.gallery.length,
      fields: <GalleryField project={project} category="flat" withCategories={false} onUploadingChange={track("gallery")} />,
    },
    {
      id: "featured",
      group: "Page sections",
      number: "06",
      label: "Featured projects",
      title: "Featured projects",
      description: "Filled automatically with your other published projects (apartments first) — nothing to edit here.",
    },
    {
      id: "seo",
      group: "Settings",
      label: "SEO & sharing",
      title: "SEO & sharing",
      description: "All optional — each falls back to the page content.",
      fieldNames: ["seoTitle", "metaDescription", "canonicalUrl"],
      fields: <SeoFields project={project} errors={e} onUploadingChange={track("og")} />,
    },
  ];

  return (
    <EditorShell
      steps={steps}
      formAction={formAction}
      state={state}
      isPending={isPending}
      uploading={uploading}
      formKey={formKey}
      publicUrl={project?.published ? `/projects/${project.slug}` : undefined}
      published={project?.published ?? false}
      submitLabel={project ? "Save changes" : "Create apartment project"}
      isNew={!project}
      category="flat"
    />
  );
}
