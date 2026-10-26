"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { createPlotGroup, updatePlotGroup } from "@/app/admin/(dashboard)/projects/actions";
import { useActionFeedback } from "@/components/admin/AdminToaster";
import { MAX_GRID } from "@/lib/admin/plotGroupSchema";
import type { PlotGroup } from "@/lib/types";

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

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
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

// Add / edit a plot category (its name, page URL and layout grid size).
export function PlotGroupForm({
  projectId,
  group,
  onCancel,
  onSaved,
}: {
  projectId: string;
  group?: PlotGroup;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = group ? updatePlotGroup.bind(null, group.id) : createPlotGroup.bind(null, projectId);
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, group ? `"${group.name}" saved.` : "Category added.");
  const e = state.fieldErrors;

  useEffect(() => {
    if (state.success) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-limestone-300 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-base text-ink">{group ? "Edit category" : "New category"}</h3>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="pg-name" error={e?.name}>
          <input id="pg-name" name="name" className={inputClass} defaultValue={group?.name} placeholder="যেমন: ৩ কাঠা" required />
        </Field>
        <Field label="Page address" htmlFor="pg-slug" hint="English, e.g. 3-katha or commercial." error={e?.slug}>
          <input id="pg-slug" name="slug" className={inputClass} defaultValue={group?.slug} placeholder="3-katha" required />
        </Field>
        <Field
          label="Rows"
          htmlFor="pg-rows"
          hint="Top to bottom, counting the road gaps too."
          error={e?.rows}
        >
          <input
            id="pg-rows"
            name="rows"
            type="number"
            min={1}
            max={MAX_GRID}
            className={inputClass}
            defaultValue={group?.rows ?? 6}
            required
          />
        </Field>
        <Field label="Columns" htmlFor="pg-columns" hint="Left to right, counting the road gaps too." error={e?.columns}>
          <input
            id="pg-columns"
            name="columns"
            type="number"
            min={1}
            max={MAX_GRID}
            className={inputClass}
            defaultValue={group?.columns ?? 10}
            required
          />
        </Field>
      </div>

      <Field label="Short note (optional)" htmlFor="pg-description" hint="Shown above the layout on the page." error={e?.description}>
        <input
          id="pg-description"
          name="description"
          className={inputClass}
          defaultValue={group?.description ?? ""}
          maxLength={300}
          placeholder="যেমন: প্রতিটি প্লট ৩ কাঠা, ২০ ফুট রাস্তা সংলগ্ন"
        />
      </Field>

      <SubmitButton label={group ? "Save Changes" : "Add Category"} />
    </form>
  );
}
