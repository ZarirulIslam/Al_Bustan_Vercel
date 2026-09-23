import { FeaturedProjectsManager } from "@/components/admin/FeaturedProjectsManager";
import { HomepageSettingsForm } from "@/components/admin/HomepageSettingsForm";
import { ContentItemManager } from "@/components/admin/ContentItemManager";
import { updateHomepageSettings } from "@/app/admin/(dashboard)/homepage/actions";
import { getAllProjectsAdmin } from "@/lib/admin/projects";
import { getHomepageSettings } from "@/lib/data/homepageSettings";
import { getContentItemsForSectionAdmin } from "@/lib/admin/contentItems";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const [projects, homepageSettings, developItems, valuePropItems] = await Promise.all([
    getAllProjectsAdmin(),
    getHomepageSettings(),
    getContentItemsForSectionAdmin("homepage_develop"),
    getContentItemsForSectionAdmin("homepage_value_prop"),
  ]);

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Homepage</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Edit the hero text and buttons, choose which projects appear as Featured Projects, edit
          the statistics tiles, and show or hide homepage sections. The hero slider images are
          managed separately under "Homepage Hero".
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg">Featured Projects</h2>
        <div className="mt-4">
          <FeaturedProjectsManager projects={projects} />
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <HomepageSettingsForm action={updateHomepageSettings} settings={homepageSettings} />
      </div>

      <div className="mt-12 max-w-3xl">
        <h2 className="text-lg">What We Develop</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The three cards in the "What we develop" section. Turn the section itself on or off
          above, under Homepage Sections.
        </p>
        <div className="mt-4">
          <ContentItemManager section="homepage_develop" items={developItems} />
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <h2 className="text-lg">Why Choose Al Bustan</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The cards in the "Why Choose Al Bustan" section. Turn the section itself on or off above,
          under Homepage Sections.
        </p>
        <div className="mt-4">
          <ContentItemManager section="homepage_value_prop" items={valuePropItems} />
        </div>
      </div>
    </div>
  );
}
