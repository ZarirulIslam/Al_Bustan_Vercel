"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createInventoryItem, updateInventoryItem } from "@/app/admin/(dashboard)/projects/actions";
import type { InventoryItem, ProjectCategory } from "@/lib/types";
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

export function InventoryItemForm({
  projectId,
  category,
  item,
  onCancel,
  onSaved,
}: {
  projectId: string;
  category: ProjectCategory;
  item?: InventoryItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isFlat = category === "flat";
  const action = item ? updateInventoryItem.bind(null, item.id) : createInventoryItem.bind(null, projectId);
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, item ? `Unit "${item.code}" saved.` : "Unit added.");
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-limestone-300 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-base text-ink">
          {item ? "Edit" : "Add"} {isFlat ? "Unit" : "Plot"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-ink-soft hover:text-ink"
        >
          Cancel
        </button>
      </div>

      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={isFlat ? "Unit Number" : "Plot Number"} htmlFor="code" error={state.fieldErrors?.code}>
          <input id="code" name="code" className={inputClass} defaultValue={item?.code} required />
        </Field>

        <Field label="Status" htmlFor="status" error={state.fieldErrors?.status}>
          <select id="status" name="status" defaultValue={item?.status ?? "available"} className={inputClass}>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </Field>

        <Field label="Size" htmlFor="size">
          <input
            id="size"
            name="size"
            className={inputClass}
            defaultValue={item?.size ?? ""}
            placeholder={isFlat ? "e.g. 1,450 sq ft" : "e.g. 5 Katha"}
          />
        </Field>

        <Field label="Facing" htmlFor="facing">
          <input
            id="facing"
            name="facing"
            className={inputClass}
            defaultValue={item?.facing ?? ""}
            placeholder="e.g. South-facing"
          />
        </Field>

        <Field label="Price" htmlFor="price">
          <input
            id="price"
            name="price"
            className={inputClass}
            defaultValue={item?.price ?? ""}
            placeholder="e.g. BDT 45,00,000"
          />
        </Field>

        {isFlat ? (
          <>
            <Field label="Floor" htmlFor="floor">
              <input id="floor" name="floor" className={inputClass} defaultValue={item?.floor ?? ""} placeholder="e.g. 5th" />
            </Field>
            <Field label="Bedrooms" htmlFor="bedrooms">
              <input id="bedrooms" name="bedrooms" className={inputClass} defaultValue={item?.bedrooms ?? ""} placeholder="e.g. 3" />
            </Field>
            <Field label="Bathrooms" htmlFor="bathrooms">
              <input id="bathrooms" name="bathrooms" className={inputClass} defaultValue={item?.bathrooms ?? ""} placeholder="e.g. 3" />
            </Field>
            <Field label="Parking" htmlFor="parking">
              <input id="parking" name="parking" className={inputClass} defaultValue={item?.parking ?? ""} placeholder="e.g. 1 car space" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Block" htmlFor="block">
              <input id="block" name="block" className={inputClass} defaultValue={item?.block ?? ""} placeholder="e.g. Block C" />
            </Field>
            <Field label="Road Width" htmlFor="roadWidth">
              <input id="roadWidth" name="roadWidth" className={inputClass} defaultValue={item?.roadWidth ?? ""} placeholder="e.g. 30 ft" />
            </Field>
          </>
        )}
      </div>

      <SubmitButton label={item ? "Save Changes" : "Add"} />
    </form>
  );
}
