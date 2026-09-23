"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import type { Testimonial } from "@/lib/types";
import type { TestimonialFormState } from "@/lib/admin/testimonialSchema";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
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

export function TestimonialForm({
  action,
  testimonial,
  projects,
  submitLabel,
}: {
  action: (prevState: TestimonialFormState, formData: FormData) => Promise<TestimonialFormState>;
  testimonial?: Testimonial;
  projects: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Customer Name" htmlFor="customerName" error={state.fieldErrors?.customerName}>
          <input
            id="customerName"
            name="customerName"
            className={inputClass}
            defaultValue={testimonial?.customerName}
            required
          />
        </Field>

        <Field label="Designation" htmlFor="designation" error={state.fieldErrors?.designation}>
          <input
            id="designation"
            name="designation"
            className={inputClass}
            defaultValue={testimonial?.designation ?? ""}
            placeholder="e.g. Homeowner, Banani"
          />
        </Field>

        <Field label="Related Project" htmlFor="projectId" error={state.fieldErrors?.projectId}>
          <select
            id="projectId"
            name="projectId"
            defaultValue={testimonial?.projectId ?? ""}
            className={inputClass}
          >
            <option value="">No related project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Testimonial Text" htmlFor="text" error={state.fieldErrors?.text}>
        <textarea
          id="text"
          name="text"
          rows={5}
          className={inputClass}
          defaultValue={testimonial?.text}
          placeholder="What the customer said…"
          required
        />
      </Field>

      <Field label="Photo" htmlFor="photoFile">
        <CoverImageUploadField
          fieldName="photoUrl"
          subdir="testimonials"
          existingUrl={testimonial?.photoUrl ?? undefined}
        />
      </Field>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="published" defaultChecked={testimonial?.published ?? true} />
        Published (visible on the homepage)
      </label>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
