"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { TeamMember } from "@/lib/types";
import type { TeamMemberFormState } from "@/lib/admin/teamMemberSchema";
import { useActionFeedback } from "@/components/admin/AdminToaster";

function SubmitButton({ label, disabledExtra }: { label: string; disabledExtra: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabledExtra}>
      {pending ? "Saving…" : disabledExtra ? "Waiting for image upload…" : label}
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

export function TeamMemberForm({
  action,
  member,
  submitLabel,
}: {
  action: (prevState: TeamMemberFormState, formData: FormData) => Promise<TeamMemberFormState>;
  member?: TeamMember;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "Team member saved.");
  const [photoUploading, setPhotoUploading] = useState(false);

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
          <input id="name" name="name" className={inputClass} defaultValue={member?.name} required />
        </Field>

        <Field label="Designation" htmlFor="designation" error={state.fieldErrors?.designation}>
          <input
            id="designation"
            name="designation"
            className={inputClass}
            defaultValue={member?.designation}
            placeholder="e.g. Managing Director"
            required
          />
        </Field>
      </div>

      <Field label="Short Professional Title" htmlFor="shortTitle" error={state.fieldErrors?.shortTitle}>
        <RichTextEditor
          id="shortTitle"
          name="shortTitle"
          defaultValue={member?.shortTitle}
          size="sm"
          maxLength={200}
          placeholder="e.g. 20+ years in residential development"
          invalid={!!state.fieldErrors?.shortTitle}
        />
      </Field>

      <Field label="Professional Bio" htmlFor="bio" error={state.fieldErrors?.bio}>
        <RichTextEditor
          id="bio"
          name="bio"
          defaultValue={member?.bio}
          size="md"
          maxLength={3000}
          placeholder="Background, experience and role at Al Bustan…"
          invalid={!!state.fieldErrors?.bio}
        />
      </Field>

      <Field label="Photo" htmlFor="photoFile">
        <CoverImageUploadField
          fieldName="photoUrl"
          subdir="team"
          existingUrl={member?.photoUrl ?? undefined}
          onUploadingChange={setPhotoUploading}
        />
      </Field>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="published" defaultChecked={member?.published ?? true} />
        Published (visible in the team section)
      </label>

      <SubmitButton label={submitLabel} disabledExtra={photoUploading} />
    </form>
  );
}
