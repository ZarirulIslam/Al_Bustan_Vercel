"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import type { SiteSettings } from "@/lib/types";
import type { SettingsFormState } from "@/lib/admin/settingsSchema";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { useActionFeedback } from "@/components/admin/AdminToaster";

function SubmitButton({ disabledExtra }: { disabledExtra: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabledExtra}>
      {pending ? "Saving…" : disabledExtra ? "Waiting for logo upload…" : "Save Settings"}
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

export function SettingsForm({
  action,
  settings,
}: {
  action: (prevState: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  settings: SiteSettings;
}) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "Website settings saved.");
  const [logoUploading, setLogoUploading] = useState(false);

  return (
    <form action={formAction} className="space-y-10">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <section>
        <h2 className="text-lg">Company</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Company Name" htmlFor="companyName" error={state.fieldErrors?.companyName}>
            <input
              id="companyName"
              name="companyName"
              className={inputClass}
              defaultValue={settings.companyName}
              required
            />
          </Field>

          <Field label="Logo" htmlFor="logoFile">
            <CoverImageUploadField
              fieldName="logoUrl"
              subdir="settings"
              existingUrl={settings.logoUrl ?? undefined}
              onUploadingChange={setLogoUploading}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Contact</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone" error={state.fieldErrors?.phone}>
            <input id="phone" name="phone" className={inputClass} defaultValue={settings.phone} required />
          </Field>
          <Field label="WhatsApp Link" htmlFor="whatsapp" error={state.fieldErrors?.whatsapp}>
            <input
              id="whatsapp"
              name="whatsapp"
              className={inputClass}
              defaultValue={settings.whatsapp}
              placeholder="https://wa.me/..."
              required
            />
          </Field>
          <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
            <input id="email" name="email" type="email" className={inputClass} defaultValue={settings.email} required />
          </Field>
          <Field label="Messenger Link (optional)" htmlFor="messengerUrl" error={state.fieldErrors?.messengerUrl}>
            <input
              id="messengerUrl"
              name="messengerUrl"
              className={inputClass}
              defaultValue={settings.messengerUrl ?? ""}
              placeholder="https://m.me/..."
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Office</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Address" htmlFor="address" error={state.fieldErrors?.address}>
            <input id="address" name="address" className={inputClass} defaultValue={settings.address} required />
          </Field>
          <Field label="Business Hours" htmlFor="businessHours" error={state.fieldErrors?.businessHours}>
            <input
              id="businessHours"
              name="businessHours"
              className={inputClass}
              defaultValue={settings.businessHours}
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
              defaultValue={settings.latitude ?? ""}
            />
          </Field>
          <Field label="Longitude (optional)" htmlFor="longitude">
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              className={inputClass}
              defaultValue={settings.longitude ?? ""}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Social Links (optional)</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Facebook" htmlFor="facebookUrl" error={state.fieldErrors?.facebookUrl}>
            <input id="facebookUrl" name="facebookUrl" className={inputClass} defaultValue={settings.social.facebook ?? ""} />
          </Field>
          <Field label="Instagram" htmlFor="instagramUrl" error={state.fieldErrors?.instagramUrl}>
            <input id="instagramUrl" name="instagramUrl" className={inputClass} defaultValue={settings.social.instagram ?? ""} />
          </Field>
          <Field label="LinkedIn" htmlFor="linkedinUrl" error={state.fieldErrors?.linkedinUrl}>
            <input id="linkedinUrl" name="linkedinUrl" className={inputClass} defaultValue={settings.social.linkedin ?? ""} />
          </Field>
          <Field label="YouTube" htmlFor="youtubeUrl" error={state.fieldErrors?.youtubeUrl}>
            <input id="youtubeUrl" name="youtubeUrl" className={inputClass} defaultValue={settings.social.youtube ?? ""} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg">Footer</h2>
        <div className="mt-4 space-y-5">
          <Field
            label="Company Description"
            htmlFor="companyDescription"
            error={state.fieldErrors?.companyDescription}
          >
            <RichTextEditor
              id="companyDescription"
              name="companyDescription"
              defaultValue={settings.companyDescription}
              size="sm"
              maxLength={500}
              invalid={!!state.fieldErrors?.companyDescription}
            />
          </Field>
          <Field label="Legal / Copyright Line" htmlFor="footerLegalText" error={state.fieldErrors?.footerLegalText}>
            <RichTextEditor
              id="footerLegalText"
              name="footerLegalText"
              defaultValue={settings.footerLegalText}
              size="sm"
              maxLength={200}
              invalid={!!state.fieldErrors?.footerLegalText}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg">SEO</h2>
        <div className="mt-4 space-y-5">
          <Field label="Default SEO Title" htmlFor="seoTitle" error={state.fieldErrors?.seoTitle}>
            <input id="seoTitle" name="seoTitle" className={inputClass} defaultValue={settings.seo.defaultTitle} required />
          </Field>
          <Field label="Default SEO Description" htmlFor="seoDescription" error={state.fieldErrors?.seoDescription}>
            <textarea
              id="seoDescription"
              name="seoDescription"
              rows={3}
              className={inputClass}
              defaultValue={settings.seo.defaultDescription}
              required
            />
          </Field>
        </div>
      </section>

      <SubmitButton disabledExtra={logoUploading} />
    </form>
  );
}
