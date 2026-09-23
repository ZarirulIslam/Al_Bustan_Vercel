"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { SalesEmployee } from "@/lib/types";
import type { SalesEmployeeFormState } from "@/lib/admin/salesTeamSchema";

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

export function SalesTeamForm({
  action,
  employee,
  submitLabel,
}: {
  action: (prevState: SalesEmployeeFormState, formData: FormData) => Promise<SalesEmployeeFormState>;
  employee?: SalesEmployee;
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
        <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
          <input id="name" name="name" className={inputClass} defaultValue={employee?.name} required />
        </Field>

        <Field label="Designation" htmlFor="designation" error={state.fieldErrors?.designation}>
          <input
            id="designation"
            name="designation"
            className={inputClass}
            defaultValue={employee?.designation}
            placeholder="e.g. Sales Executive"
            required
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={state.fieldErrors?.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={inputClass}
            defaultValue={employee?.phone}
            required
          />
        </Field>

        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            className={inputClass}
            defaultValue={employee?.email}
            required
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="active" defaultChecked={employee?.active ?? true} />
        Active (can be assigned new leads)
      </label>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
