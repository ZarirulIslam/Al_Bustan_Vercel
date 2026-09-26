"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { Redirect } from "@/lib/types";
import type { RedirectFormState } from "@/lib/admin/redirectSchema";
import { useActionFeedback } from "@/components/admin/AdminToaster";

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

export function RedirectForm({
  action,
  redirect,
  submitLabel,
}: {
  action: (prevState: RedirectFormState, formData: FormData) => Promise<RedirectFormState>;
  redirect?: Redirect;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, "Redirect saved.");

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="From Path" htmlFor="fromPath" error={state.fieldErrors?.fromPath}>
          <input
            id="fromPath"
            name="fromPath"
            className={inputClass}
            defaultValue={redirect?.fromPath}
            placeholder="/old-page"
            required
          />
        </Field>

        <Field label="To (destination)" htmlFor="toPath" error={state.fieldErrors?.toPath}>
          <input
            id="toPath"
            name="toPath"
            className={inputClass}
            defaultValue={redirect?.toPath}
            placeholder="/new-page or https://example.com"
            required
          />
        </Field>

        <Field label="Redirect Type" htmlFor="kind" error={state.fieldErrors?.kind}>
          <select id="kind" name="kind" defaultValue={redirect?.kind ?? "permanent"} className={inputClass}>
            <option value="permanent">Permanent (301)</option>
            <option value="temporary">Temporary (302)</option>
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="enabled" defaultChecked={redirect?.enabled ?? true} />
        Enabled
      </label>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
