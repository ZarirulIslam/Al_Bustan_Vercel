"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import type { HomepageSettings } from "@/lib/types";
import type { HomepageSettingsFormState } from "@/lib/admin/homepageSettingsSchema";

function SubmitButton({ disabledExtra }: { disabledExtra: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabledExtra}>
      {pending ? "Saving…" : disabledExtra ? "Waiting for image upload…" : "Save Homepage Settings"}
    </Button>
  );
}

function Toggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-limestone-300 bg-white px-4 py-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-garden-500"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>}
      </span>
    </label>
  );
}

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

export function HomepageSettingsForm({
  action,
  settings,
}: {
  action: (prevState: HomepageSettingsFormState, formData: FormData) => Promise<HomepageSettingsFormState>;
  settings: HomepageSettings;
}) {
  const [state, formAction] = useActionState(action, {});
  const [introImageUploading, setIntroImageUploading] = useState(false);

  return (
    <form action={formAction} className="space-y-10">
      {state.success && (
        <p className="rounded border border-garden-300 bg-garden-50 px-4 py-3 text-sm text-garden-700">
          Homepage settings saved.
        </p>
      )}
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <section>
        <h2 className="text-lg">Hero Text &amp; Buttons</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The overlay text and the two buttons drawn on top of the hero slider. The background
          images themselves are managed separately under "Homepage Hero".
        </p>

        <div className="mt-4">
          <Toggle
            name="heroTextEnabled"
            label="Show the eyebrow, headline and description on the homepage"
            description="Turning this off hides only the text — the image slider and any enabled buttons still show."
            defaultChecked={settings.heroTextEnabled}
          />
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="heroEyebrow" className="text-sm text-ink">
              Eyebrow text
            </label>
            <input
              id="heroEyebrow"
              name="heroEyebrow"
              className={inputClass}
              defaultValue={settings.heroEyebrow}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="heroHeadline" className="text-sm text-ink">
              Headline
            </label>
            <input
              id="heroHeadline"
              name="heroHeadline"
              className={inputClass}
              defaultValue={settings.heroHeadline}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="heroDescription" className="text-sm text-ink">
              Description
            </label>
            <textarea
              id="heroDescription"
              name="heroDescription"
              rows={3}
              className={inputClass}
              defaultValue={settings.heroDescription}
              required
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-limestone-300 p-4">
            <p className="text-sm font-medium text-ink">Primary button</p>
            <Toggle
              name="heroPrimaryButtonEnabled"
              label="Show this button"
              defaultChecked={settings.heroPrimaryButtonEnabled}
            />
            <label htmlFor="heroPrimaryButtonLabel" className="mt-2 block text-sm text-ink">
              Button text
            </label>
            <input
              id="heroPrimaryButtonLabel"
              name="heroPrimaryButtonLabel"
              className={inputClass}
              defaultValue={settings.heroPrimaryButtonLabel}
              required
            />
            <label htmlFor="heroPrimaryButtonUrl" className="mt-2 block text-sm text-ink">
              Link
            </label>
            <input
              id="heroPrimaryButtonUrl"
              name="heroPrimaryButtonUrl"
              className={inputClass}
              defaultValue={settings.heroPrimaryButtonUrl}
              placeholder="/projects"
              required
            />
          </div>
          <div className="space-y-2 rounded-lg border border-limestone-300 p-4">
            <p className="text-sm font-medium text-ink">Secondary button</p>
            <Toggle
              name="heroSecondaryButtonEnabled"
              label="Show this button"
              defaultChecked={settings.heroSecondaryButtonEnabled}
            />
            <label htmlFor="heroSecondaryButtonLabel" className="mt-2 block text-sm text-ink">
              Button text
            </label>
            <input
              id="heroSecondaryButtonLabel"
              name="heroSecondaryButtonLabel"
              className={inputClass}
              defaultValue={settings.heroSecondaryButtonLabel}
              required
            />
            <label htmlFor="heroSecondaryButtonUrl" className="mt-2 block text-sm text-ink">
              Link
            </label>
            <input
              id="heroSecondaryButtonUrl"
              name="heroSecondaryButtonUrl"
              className={inputClass}
              defaultValue={settings.heroSecondaryButtonUrl}
              placeholder="/contact"
              required
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Homepage Statistics</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The "Where our projects stand" tiles. Counts always come live from real published
          projects, so only the label and visibility of each tile can be changed here. Each label
          is shown as-is next to the count — e.g. "Ongoing" appears as "4 Ongoing Projects", so
          enter just the category name, not the full phrase.
        </p>

        <div className="mt-4">
          <Toggle
            name="statsSectionEnabled"
            label="Show this section on the homepage"
            defaultChecked={settings.statsSectionEnabled}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="ongoingStatLabel" className="text-sm text-ink">
              Ongoing tile label
            </label>
            <input
              id="ongoingStatLabel"
              name="ongoingStatLabel"
              className={inputClass}
              defaultValue={settings.ongoingStatLabel}
              required
            />
            <Toggle name="ongoingStatEnabled" label="Show" defaultChecked={settings.ongoingStatEnabled} />
          </div>
          <div className="space-y-2">
            <label htmlFor="completedStatLabel" className="text-sm text-ink">
              Completed tile label
            </label>
            <input
              id="completedStatLabel"
              name="completedStatLabel"
              className={inputClass}
              defaultValue={settings.completedStatLabel}
              required
            />
            <Toggle name="completedStatEnabled" label="Show" defaultChecked={settings.completedStatEnabled} />
          </div>
          <div className="space-y-2">
            <label htmlFor="upcomingStatLabel" className="text-sm text-ink">
              Upcoming tile label
            </label>
            <input
              id="upcomingStatLabel"
              name="upcomingStatLabel"
              className={inputClass}
              defaultValue={settings.upcomingStatLabel}
              required
            />
            <Toggle name="upcomingStatEnabled" label="Show" defaultChecked={settings.upcomingStatEnabled} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Company Introduction</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The "A developer that plans for how families really live" section's own heading, text and
          photo. Turn it on or off in Homepage Sections below.
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="introHeading" className="text-sm text-ink">
              Heading
            </label>
            <input
              id="introHeading"
              name="introHeading"
              className={inputClass}
              defaultValue={settings.introHeading}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="introBody" className="text-sm text-ink">
              Body text
            </label>
            <textarea
              id="introBody"
              name="introBody"
              rows={4}
              className={inputClass}
              defaultValue={settings.introBody}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-ink">Photo</label>
            <CoverImageUploadField
              fieldName="introImageUrl"
              subdir="settings"
              existingUrl={settings.introImageUrl}
              onUploadingChange={setIntroImageUploading}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Homepage Sections</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Show or hide these sections. The hero background slider and the closing contact block
          always stay visible — the hero's own text and buttons are edited above.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            name="introSectionEnabled"
            label="Company introduction"
            description='"A developer that plans for how families really live"'
            defaultChecked={settings.introSectionEnabled}
          />
          <Toggle
            name="whatWeDevelopSectionEnabled"
            label="What we develop"
            defaultChecked={settings.whatWeDevelopSectionEnabled}
          />
          <Toggle
            name="featuredProjectsSectionEnabled"
            label="Featured projects"
            description="Also hidden automatically if no projects are featured."
            defaultChecked={settings.featuredProjectsSectionEnabled}
          />
          <Toggle
            name="valuePropsSectionEnabled"
            label="What guides how we build"
            defaultChecked={settings.valuePropsSectionEnabled}
          />
          <Toggle
            name="testimonialsSectionEnabled"
            label="Customer testimonials"
            description="Also hidden automatically if no testimonials are published. Manage testimonials from the Testimonials section."
            defaultChecked={settings.testimonialsSectionEnabled}
          />
          <Toggle
            name="ctaSectionEnabled"
            label='"Ready to find your place?" banner'
            defaultChecked={settings.ctaSectionEnabled}
          />
          <Toggle
            name="blogSectionEnabled"
            label="Latest blog posts"
            description="Also hidden automatically if no posts are published."
            defaultChecked={settings.blogSectionEnabled}
          />
        </div>
      </section>

      <SubmitButton disabledExtra={introImageUploading} />
    </form>
  );
}
