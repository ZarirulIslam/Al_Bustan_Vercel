"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createInventoryItem, updateInventoryItem } from "@/app/admin/(dashboard)/projects/actions";
import type { InventoryItem, PaymentMode, PlotGroup, ProjectCategory } from "@/lib/types";
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
  groups = [],
  placement,
  defaultCode,
  onCancel,
  onSaved,
}: {
  projectId: string;
  category: ProjectCategory;
  item?: InventoryItem;
  // Plot categories this item can be placed in (land projects).
  groups?: PlotGroup[];
  // Where a new plot goes when it's added from an empty layout cell.
  placement?: { groupId: string; gridRow: number; gridCol: number };
  defaultCode?: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isFlat = category === "flat";
  const action = item ? updateInventoryItem.bind(null, item.id) : createInventoryItem.bind(null, projectId);
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, item ? `Unit "${item.code}" saved.` : "Unit added.");
  const router = useRouter();
  const [paymentMode, setPaymentMode] = useState<PaymentMode | "">(item?.paymentMode ?? "");
  const [groupId, setGroupId] = useState(item?.groupId ?? placement?.groupId ?? "");

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
          <input id="code" name="code" className={inputClass} defaultValue={item?.code ?? defaultCode} required />
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

      {/* No category list given: keep the plot's current spot as-is. */}
      {groups.length === 0 && item?.groupId && (
        <>
          <input type="hidden" name="groupId" value={item.groupId} />
          <input type="hidden" name="gridRow" value={item.gridRow ?? ""} />
          <input type="hidden" name="gridCol" value={item.gridCol ?? ""} />
        </>
      )}

      {groups.length > 0 && (
        <div className="space-y-4 border-t border-limestone-300 pt-4">
          <div>
            <h4 className="text-sm font-semibold text-ink">Layout position</h4>
            <p className="mt-0.5 text-xs text-ink-soft">
              The category page this plot appears on, and its spot on that layout (row 1 is the top, column 1 the
              left).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Category" htmlFor="groupId" error={state.fieldErrors?.groupId}>
              <select
                id="groupId"
                name="groupId"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Not on a layout</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            {groupId && (
              <>
                <Field label="Row" htmlFor="gridRow" error={state.fieldErrors?.gridRow}>
                  <input
                    id="gridRow"
                    name="gridRow"
                    inputMode="numeric"
                    className={inputClass}
                    defaultValue={item?.gridRow ?? placement?.gridRow ?? ""}
                    required
                  />
                </Field>
                <Field label="Column" htmlFor="gridCol" error={state.fieldErrors?.gridCol}>
                  <input
                    id="gridCol"
                    name="gridCol"
                    inputMode="numeric"
                    className={inputClass}
                    defaultValue={item?.gridCol ?? placement?.gridCol ?? ""}
                    required
                  />
                </Field>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 border-t border-limestone-300 pt-4">
        <div>
          <h4 className="text-sm font-semibold text-ink">Buyer</h4>
          <p className="mt-0.5 text-xs text-ink-soft">
            Fill in once the {isFlat ? "unit" : "plot"} is booked or sold. The name and payment are shown on the
            public page while the status is Reserved or Sold; the file number stays internal.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client Name" htmlFor="clientName" error={state.fieldErrors?.clientName}>
            <input id="clientName" name="clientName" className={inputClass} defaultValue={item?.clientName ?? ""} maxLength={120} />
          </Field>

          <Field label="File Number" htmlFor="fileNumber" error={state.fieldErrors?.fileNumber}>
            <input
              id="fileNumber"
              name="fileNumber"
              className={inputClass}
              defaultValue={item?.fileNumber ?? ""}
              maxLength={60}
              placeholder="e.g. ABC-0142"
            />
          </Field>

          <Field label="Payment" htmlFor="paymentMode" error={state.fieldErrors?.paymentMode}>
            <select
              id="paymentMode"
              name="paymentMode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode | "")}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="one_time">One-time (এককালীন)</option>
              <option value="installment">Installment (কিস্তি)</option>
            </select>
          </Field>

          {paymentMode === "installment" && (
            <>
              <Field label="Total Installments" htmlFor="totalInstallments" error={state.fieldErrors?.totalInstallments}>
                <input
                  id="totalInstallments"
                  name="totalInstallments"
                  inputMode="numeric"
                  className={inputClass}
                  defaultValue={item?.totalInstallments ?? ""}
                  placeholder="e.g. 36"
                />
              </Field>
              <Field
                label="Installments Remaining"
                htmlFor="remainingInstallments"
                error={state.fieldErrors?.remainingInstallments}
              >
                <input
                  id="remainingInstallments"
                  name="remainingInstallments"
                  inputMode="numeric"
                  className={inputClass}
                  defaultValue={item?.remainingInstallments ?? ""}
                  placeholder="e.g. 24"
                  required
                />
              </Field>
            </>
          )}
        </div>
      </div>

      <SubmitButton label={item ? "Save Changes" : "Add"} />
    </form>
  );
}
