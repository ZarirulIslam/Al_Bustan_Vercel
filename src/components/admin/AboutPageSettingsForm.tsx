"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import type { AboutPageSettings } from "@/lib/types";
import type { AboutPageSettingsFormState } from "@/lib/admin/aboutPageSettingsSchema";

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
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [overviewImageUploading, setOverviewImageUploading] = useState(false);

  return (
    <form action={formAction} className="space-y-10">
      {state.success && (
        <p className="rounded border border-garden-300 bg-garden-50 px-4 py-3 text-sm text-garden-700">
          About page saved.
        </p>
      )}
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
            <textarea
              id="overviewParagraph"
              name="overviewParagraph"
              rows={5}
              className={inputClass}
              defaultValue={settings.overviewParagraph}
              required
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
          <textarea
            id="visionParagraph"
            name="visionParagraph"
            rows={3}
            className={inputClass}
            defaultValue={settings.visionParagraph}
            required
          />
          {state.fieldErrors?.visionParagraph && (
            <p className="text-xs text-red-700">{state.fieldErrors.visionParagraph}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg">Our Portfolio</h2>
        <div className="mt-4 space-y-2">
          <label htmlFor="portfolioParagraph" className="text-sm text-ink">
            Paragraph
          </label>
          <textarea
            id="portfolioParagraph"
            name="portfolioParagraph"
            rows={2}
            className={inputClass}
            defaultValue={settings.portfolioParagraph}
            required
          />
          {state.fieldErrors?.portfolioParagraph && (
            <p className="text-xs text-red-700">{state.fieldErrors.portfolioParagraph}</p>
          )}
        </div>
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

      <SubmitButton disabledExtra={heroImageUploading || overviewImageUploading} />
    </form>
  );
}
