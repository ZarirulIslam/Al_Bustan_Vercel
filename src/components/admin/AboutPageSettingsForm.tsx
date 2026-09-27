"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import type { AboutPageSettings } from "@/lib/types";
import type { AboutPageSettingsFormState } from "@/lib/admin/aboutPageSettingsSchema";
import { useActionFeedback } from "@/components/admin/AdminToaster";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

function SubmitButton({ disabledExtra }: { disabledExtra: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabledExtra}>
      {pending ? "Saving…" : disabledExtra ? "Waiting for image upload…" : "Save About Page"}
    </Button>
  );
}

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

export function AboutPageSettingsForm({
  action,
  settings,
}: {
  action: (prevState: AboutPageSettingsFormState, formData: FormData) => Promise<AboutPageSettingsFormState>;
  settings: AboutPageSettings;
}) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "About page saved.");
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [overviewImageUploading, setOverviewImageUploading] = useState(false);
  const [leaderPhotoUploading, setLeaderPhotoUploading] = useState(false);

  return (
    <form action={formAction} className="space-y-10">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <section>
        <h2 className="text-lg">Page Header</h2>
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
            {state.fieldErrors?.heroEyebrow && (
              <p className="text-xs text-red-700">{state.fieldErrors.heroEyebrow}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="heroHeading" className="text-sm text-ink">
              Heading
            </label>
            <input
              id="heroHeading"
              name="heroHeading"
              className={inputClass}
              defaultValue={settings.heroHeading}
              required
            />
            {state.fieldErrors?.heroHeading && (
              <p className="text-xs text-red-700">{state.fieldErrors.heroHeading}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="heroParagraph" className="text-sm text-ink">
              Paragraph
            </label>
            <textarea
              id="heroParagraph"
              name="heroParagraph"
              rows={3}
              className={inputClass}
              defaultValue={settings.heroParagraph}
              required
            />
            {state.fieldErrors?.heroParagraph && (
              <p className="text-xs text-red-700">{state.fieldErrors.heroParagraph}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-ink">Background photo</label>
            <CoverImageUploadField
              fieldName="heroImageUrl"
              subdir="settings"
              existingUrl={settings.heroImageUrl}
              onUploadingChange={setHeroImageUploading}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Company Overview</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="overviewParagraph" className="text-sm text-ink">
              Paragraph
            </label>
            <RichTextEditor
              id="overviewParagraph"
              name="overviewParagraph"
              defaultValue={settings.overviewParagraph}
              size="md"
              maxLength={1500}
              invalid={!!state.fieldErrors?.overviewParagraph}
            />
            {state.fieldErrors?.overviewParagraph && (
              <p className="text-xs text-red-700">{state.fieldErrors.overviewParagraph}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-ink">Photo</label>
            <CoverImageUploadField
              fieldName="overviewImageUrl"
              subdir="settings"
              existingUrl={settings.overviewImageUrl}
              onUploadingChange={setOverviewImageUploading}
            />
          </div>
          <p className="text-xs text-ink-soft">
            The "What we do" list below the overview text is managed separately, further down this
            page.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Vision</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The Mission list next to this is managed separately, further down this page.
        </p>
        <div className="mt-4 space-y-2">
          <label htmlFor="visionParagraph" className="text-sm text-ink">
            Paragraph
          </label>
          <RichTextEditor
            id="visionParagraph"
            name="visionParagraph"
            defaultValue={settings.visionParagraph}
            size="sm"
            maxLength={600}
            invalid={!!state.fieldErrors?.visionParagraph}
          />
          {state.fieldErrors?.visionParagraph && (
            <p className="text-xs text-red-700">{state.fieldErrors.visionParagraph}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg">Leadership Message</h2>
        <p className="mt-1 text-sm text-ink-soft">
          A message from your Chairman, MD or other leader, shown after Vision &amp; Mission. Type
          the title yourself (e.g. &ldquo;Chairman&rsquo;s <em>Message</em>&rdquo; or &ldquo;Message
          from the MD&rdquo;). Any word you make <em>italic</em> in the heading shows in gold. The
          section is hidden while the message is empty.
        </p>
        <label className="mt-4 flex items-start gap-3 rounded-lg border border-limestone-300 bg-white px-4 py-3">
          <input
            type="checkbox"
            name="leaderSectionEnabled"
            defaultChecked={settings.leaderSectionEnabled}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-garden-500"
          />
          <span className="text-sm font-medium text-ink">Show the leadership message on the About page</span>
        </label>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="leaderHeading" className="text-sm text-ink">
              Heading
            </label>
            <RichTextEditor
              id="leaderHeading"
              name="leaderHeading"
              defaultValue={settings.leaderHeading}
              size="sm"
              maxLength={80}
              placeholder="Chairman’s Message"
              invalid={!!state.fieldErrors?.leaderHeading}
            />
            {state.fieldErrors?.leaderHeading && (
              <p className="text-xs text-red-700">{state.fieldErrors.leaderHeading}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="leaderMessage" className="text-sm text-ink">
              Message
            </label>
            <RichTextEditor
              id="leaderMessage"
              name="leaderMessage"
              defaultValue={settings.leaderMessage}
              size="lg"
              maxLength={4000}
              placeholder="Write the message here. Bold text is shown darker, for emphasis."
              invalid={!!state.fieldErrors?.leaderMessage}
            />
            {state.fieldErrors?.leaderMessage && (
              <p className="text-xs text-red-700">{state.fieldErrors.leaderMessage}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="leaderName" className="text-sm text-ink">
                Name
              </label>
              <RichTextEditor
                id="leaderName"
                name="leaderName"
                defaultValue={settings.leaderName}
                size="sm"
                maxLength={100}
                placeholder="Full name"
                invalid={!!state.fieldErrors?.leaderName}
              />
              {state.fieldErrors?.leaderName && (
                <p className="text-xs text-red-700">{state.fieldErrors.leaderName}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="leaderRole" className="text-sm text-ink">
                Role
              </label>
              <RichTextEditor
                id="leaderRole"
                name="leaderRole"
                defaultValue={settings.leaderRole}
                size="sm"
                maxLength={150}
                placeholder="Chairman, Al Bustan Communities Limited"
                invalid={!!state.fieldErrors?.leaderRole}
              />
              {state.fieldErrors?.leaderRole && (
                <p className="text-xs text-red-700">{state.fieldErrors.leaderRole}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-ink">Portrait photo</label>
            <CoverImageUploadField
              fieldName="leaderPhotoUrl"
              subdir="settings"
              existingUrl={settings.leaderPhotoUrl ?? undefined}
              onUploadingChange={setLeaderPhotoUploading}
            />
            <p className="text-xs text-ink-soft">
              A portrait (taller than wide) works best — it&apos;s cropped from the top. Without a
              photo, the message is shown centred on its own.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Our Portfolio</h2>
        <div className="mt-4 space-y-2">
          <label htmlFor="portfolioParagraph" className="text-sm text-ink">
            Paragraph
          </label>
          <RichTextEditor
            id="portfolioParagraph"
            name="portfolioParagraph"
            defaultValue={settings.portfolioParagraph}
            size="sm"
            maxLength={400}
            invalid={!!state.fieldErrors?.portfolioParagraph}
          />
          {state.fieldErrors?.portfolioParagraph && (
            <p className="text-xs text-red-700">{state.fieldErrors.portfolioParagraph}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg">Our Team</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Team members are managed from the Team section. The section is also hidden automatically
          if no members are published.
        </p>
        <label className="mt-4 flex items-start gap-3 rounded-lg border border-limestone-300 bg-white px-4 py-3">
          <input
            type="checkbox"
            name="teamSectionEnabled"
            defaultChecked={settings.teamSectionEnabled}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-garden-500"
          />
          <span className="text-sm font-medium text-ink">Show the team section on the About page</span>
        </label>
      </section>

      <section>
        <h2 className="text-lg">Closing Banner</h2>
        <div className="mt-4 space-y-2">
          <label htmlFor="ctaHeading" className="text-sm text-ink">
            Heading
          </label>
          <input
            id="ctaHeading"
            name="ctaHeading"
            className={inputClass}
            defaultValue={settings.ctaHeading}
            required
          />
          {state.fieldErrors?.ctaHeading && <p className="text-xs text-red-700">{state.fieldErrors.ctaHeading}</p>}
        </div>
      </section>

      <SubmitButton disabledExtra={heroImageUploading || overviewImageUploading || leaderPhotoUploading} />
    </form>
  );
}
