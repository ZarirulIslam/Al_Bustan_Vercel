import { AboutPageSettingsForm } from "@/components/admin/AboutPageSettingsForm";
import { ContentItemManager } from "@/components/admin/ContentItemManager";
import { updateAboutPageSettings } from "@/app/admin/(dashboard)/about/actions";
import { getAboutPageSettings } from "@/lib/data/aboutPageSettings";
import { getContentItemsForSectionAdmin } from "@/lib/admin/contentItems";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const [settings, whatWeDo, missionPoints, coreValues, approachSteps] = await Promise.all([
    getAboutPageSettings(),
    getContentItemsForSectionAdmin("about_what_we_do"),
    getContentItemsForSectionAdmin("about_mission_points"),
    getContentItemsForSectionAdmin("about_core_values"),
    getContentItemsForSectionAdmin("about_approach_steps"),
  ]);

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">About Page</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Edit every section of the public About page — the header, company overview, vision, leadership message,
          mission, core values, approach and closing banner.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <AboutPageSettingsForm action={updateAboutPageSettings} settings={settings} />
      </div>

      <div className="mt-12 max-w-3xl">
        <h2 className="text-lg">What We Do</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The bullet list under the Company Overview paragraph. Only the title and description are
          shown for this list.
        </p>
        <div className="mt-4">
          <ContentItemManager section="about_what_we_do" items={whatWeDo} />
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <h2 className="text-lg">Mission</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The checklist next to Vision. Only the title is shown for this list — leave the
          description blank.
        </p>
        <div className="mt-4">
          <ContentItemManager section="about_mission_points" items={missionPoints} addLabel="+ Add Mission Point" />
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <h2 className="text-lg">Core Values</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The four-card "Core values" section, each with its own icon and color.
        </p>
        <div className="mt-4">
          <ContentItemManager section="about_core_values" items={coreValues} addLabel="+ Add Core Value" />
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <h2 className="text-lg">Our Approach</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The numbered steps section. Steps are numbered automatically by their order below — icon
          and color aren&apos;t used for this list.
        </p>
        <div className="mt-4">
          <ContentItemManager section="about_approach_steps" items={approachSteps} addLabel="+ Add Step" />
        </div>
      </div>
    </div>
  );
}
