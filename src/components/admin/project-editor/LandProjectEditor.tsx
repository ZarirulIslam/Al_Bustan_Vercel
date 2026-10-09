"use client";

import { useActionState, useEffect, useState } from "react";
import { SectionItemsManager } from "@/components/admin/SectionItemsManager";
import { useActionFeedback } from "@/components/admin/AdminToaster";
import { EditorShell, type EditorStep } from "@/components/admin/project-editor/EditorShell";
import {
  BrochureField,
  GalleryField,
  Grid,
  ImageField,
  MapFields,
  NameSlugFields,
  RichField,
  SeoFields,
  StatusField,
  TextArea,
  TextInput,
  VideoField,
  useUploadTracker,
} from "@/components/admin/project-editor/fields";
import type { ProjectFormState } from "@/lib/admin/projectSchema";
import type { ProjectSectionItemsBySection } from "@/lib/data/projectSectionItems";
import type { Project } from "@/lib/types";

// CMS editor for Land / Plot projects. Its steps are the sections of the
// Bangla land page (src/components/project/LandProjectView.tsx), in page
// order, and hold only what those sections show. Fields the page doesn't
// use aren't here — and saving never clears them (see onlySubmitted in
// the project actions).
export function LandProjectEditor({
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
  const items = (section: keyof ProjectSectionItemsBySection, title?: string) =>
    id && sections ? (
      <SectionItemsManager projectId={id} section={section} items={sections[section]} title={title} />
    ) : (
      <LockedNote />
    );
  const count = (section: keyof ProjectSectionItemsBySection) => sections?.[section].length;

  const steps: EditorStep[] = [
    {
      id: "basics",
      group: "Setup",
      label: "Project basics",
      title: "Project basics",
      description: "Name, web address and status, plus the area and plot sizes shown on project cards. The page is in Bangla.",
      fieldNames: ["name", "slug", "status", "projectType", "totalArea", "sizesOffered"],
      fields: (
        <>
          <input type="hidden" name="category" value="land_plot" />
          <NameSlugFields project={project} errors={e} />
          <Grid>
            <StatusField project={project} errors={e} />
            <TextInput name="projectType" label="Project type" defaultValue={project?.projectType} placeholder="যেমন: আবাসিক টাউনশিপ" required errors={e} />
            <TextInput name="totalArea" label="Total area (project cards)" defaultValue={project?.totalArea} placeholder="যেমন: প্রায় ৪৫০ বিঘা" required errors={e} />
            <TextInput name="sizesOffered" label="Plot sizes (project cards)" defaultValue={project?.sizesOffered} placeholder="যেমন: ৩, ৫, ১০ ও ২০ কাঠা" errors={e} />
          </Grid>
        </>
      ),
    },
    {
      id: "hero",
      group: "Page sections",
      number: "01",
      label: "Hero",
      title: "Hero",
      description: "Small line above the name, the project name and the short introduction.",
      fieldNames: ["tagline", "shortDescription"],
      fields: (
        <>
          <TextInput name="tagline" label="Line above the name" defaultValue={project?.tagline} placeholder="যেমন: আধুনিক উন্নয়নের স্মার্ট ঠিকানা" maxLength={160} errors={e} />
          <TextArea
            name="shortDescription"
            label="Short introduction"
            defaultValue={project?.shortDescription}
            hint="Also used on project cards."
            required
            rows={3}
            errors={e}
          />
        </>
      ),
    },
    {
      id: "about",
      group: "Page sections",
      number: "02",
      label: "প্রকল্প পরিচিতি",
      title: "প্রকল্প পরিচিতি",
      description: "Introduction text, three figures, the মাস্টার প্ল্যান / ব্রোশিওর buttons and the cover photo.",
      anchor: "about",
      count: count("stat"),
      fieldNames: ["fullDescription"],
      fields: (
        <>
          <RichField name="fullDescription" label="Introduction text" defaultValue={project?.fullDescription} placeholder="প্রকল্পের পরিচিতি লিখুন…" errors={e} />
          <ImageField
            name="coverImageUrl"
            label="Cover photo"
            existingUrl={project?.coverImage.url}
            required={!project}
            hint="Shown beside the introduction and on project cards."
            onUploadingChange={track("cover")}
          />
          <Grid>
            <ImageField
              name="masterPlanUrl"
              label="Master plan image"
              existingUrl={project?.masterPlanUrl}
              hint="Also shown in লোকেশন ম্যাপ and the booking section."
              onUploadingChange={track("masterPlan")}
            />
            <BrochureField project={project} hint="Powers every ব্রোশিওর download button." onUploadingChange={track("brochure")} />
          </Grid>
        </>
      ),
      extra: items("stat", "Figures (value + label)"),
    },
    {
      id: "location",
      group: "Page sections",
      number: "03",
      label: "অবস্থান",
      title: "{name}-এর অবস্থান",
      description:
        "Left: the first video (from the ভিডিও step) and connectivity cards, which scroll past the text. Right, fixed: the location text, highlight chips and Google Maps button.",
      anchor: "location",
      count: count("location_highlight"),
      fieldNames: ["location", "latitude", "longitude", "nearbyFacilities", "features"],
      fields: (
        <>
          <TextInput name="location" label="Address / area" defaultValue={project?.location} placeholder="যেমন: কাঞ্চন পৌরসভা, রূপগঞ্জ, নারায়ণগঞ্জ" required errors={e} />
          <MapFields project={project} />
          <RichField
            name="nearbyFacilities"
            label="Location text"
            defaultValue={project?.nearbyFacilities}
            placeholder="প্রকল্পটি কোথায় এবং কীভাবে যাতায়াত করা যায়…"
            maxLength={3000}
            errors={e}
          />
          <RichField
            name="features"
            label="Highlight chips"
            defaultValue={project?.features}
            hint="A bulleted list — each bullet becomes a chip, e.g. শীতলক্ষ্যা নদী সংলগ্ন."
            maxLength={3000}
            errors={e}
          />
        </>
      ),
      extra: items("location_highlight", "Connectivity cards"),
    },
    {
      id: "features",
      group: "Page sections",
      number: "04",
      label: "বৈশিষ্ট্যসমূহ",
      title: "{name}-এর বৈশিষ্ট্যসমূহ",
      description: "Icon list beside a photo carousel (photos from the গ্যালারি step).",
      anchor: "features",
      count: count("key_feature"),
      extra: items("key_feature", "Features"),
    },
    {
      id: "plots",
      group: "Page sections",
      number: "05",
      label: "উপলব্ধ প্লটসমূহ",
      title: "উপলব্ধ প্লটসমূহ",
      description: "Plot cards under the আবাসিক / বাণিজ্যিক tabs — choose the tab for each card.",
      anchor: "plots",
      count: count("plot_type"),
      extra: items("plot_type", "Plot types"),
    },
    {
      id: "goals",
      group: "Page sections",
      number: "06",
      label: "লক্ষ্য",
      title: "{name}-এর লক্ষ্য",
      description: "Numbered photo cards that scroll past the fixed “একটি স্বপ্নের ঠিকানা” text.",
      anchor: "goals",
      count: count("goal"),
      extra: items("goal", "Goals"),
    },
    {
      id: "gallery",
      group: "Page sections",
      number: "07",
      label: "গ্যালারি",
      title: "ভিজ্যুয়াল ট্যুর",
      description: "Photo grid. These photos also feed the feature carousel and the plot collage.",
      anchor: "gallery",
      count: project?.gallery.length,
      fields: <GalleryField project={project} category="land_plot" withCategories={false} onUploadingChange={track("gallery")} />,
    },
    {
      id: "video",
      group: "Page sections",
      number: "08",
      label: "ভিডিও",
      title: "ভিডিওতে দেখুন",
      description: "Video section with a playlist. The first video is also shown in the অবস্থান section.",
      anchor: "video",
      count: project?.videoUrls.length,
      fieldNames: ["videoUrls"],
      fields: <VideoField project={project} errors={e} />,
    },
    {
      id: "map",
      group: "Page sections",
      number: "09",
      label: "লোকেশন ম্যাপ",
      title: "{name} লোকেশন ম্যাপ",
      description: "Master plan (from step 02 — Google Map when there is none) beside the address and these routes.",
      anchor: "master-plan",
      count: count("route"),
      extra: items("route", "Routes & landmarks"),
    },
    {
      id: "security",
      group: "Page sections",
      number: "10",
      label: "সুরক্ষিত জোন",
      title: "সর্বোচ্চ সুরক্ষিত জোন",
      anchor: "security",
      count: count("security"),
      extra: items("security", "Security"),
    },
    {
      id: "amenities",
      group: "Page sections",
      number: "11",
      label: "সুযোগ-সুবিধা",
      title: "সকল সুযোগ-সুবিধার সমাহার",
      anchor: "amenities",
      count: count("amenity"),
      extra: items("amenity", "Amenities"),
    },
    {
      id: "partners",
      group: "Page sections",
      number: "12",
      label: "অঙ্গপ্রতিষ্ঠান",
      title: "আমাদের অঙ্গপ্রতিষ্ঠান",
      anchor: "partners",
      count: count("partner"),
      extra: items("partner", "Sister concerns"),
    },
    {
      id: "booking",
      group: "Page sections",
      number: "13",
      label: "প্লট বুকিং",
      title: "মাস্টার প্ল্যান ও প্লট বুকিং",
      description: "Master plan and brochure come from step 02. Bookings arrive in Leads & Inquiries.",
      anchor: "booking",
      fieldNames: ["block"],
      fields: (
        <TextInput
          name="block"
          label="Blocks in the booking form"
          defaultValue={project?.block}
          placeholder="e.g. A, B, C, D"
          hint="Comma-separated. Leave empty to let visitors type a block."
          errors={e}
        />
      ),
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

  // Section titles that include the project name.
  const named = steps.map((s) => ({ ...s, title: s.title.replace("{name}", project?.name ?? "প্রকল্প") }));

  return (
    <EditorShell
      steps={named}
      formAction={formAction}
      state={state}
      isPending={isPending}
      uploading={uploading}
      formKey={formKey}
      publicUrl={project?.published ? `/projects/${project.slug}` : undefined}
      published={project?.published ?? false}
      submitLabel={project ? "Save changes" : "Create land project"}
      isNew={!project}
      category="land_plot"
    />
  );
}

export function LockedNote() {
  return (
    <p className="rounded-lg border border-dashed border-limestone-300 bg-limestone-100 px-4 py-6 text-center text-sm text-ink-soft">
      Save the project first — then you can add items here.
    </p>
  );
}
