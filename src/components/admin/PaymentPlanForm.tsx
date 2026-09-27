"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createPaymentPlan, updatePaymentPlan } from "@/app/admin/(dashboard)/projects/actions";
import type { PaymentPlan } from "@/lib/types";
import { useActionFeedback } from "@/components/admin/AdminToaster";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

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

export function PaymentPlanForm({
  projectId,
  plan,
  onCancel,
  onSaved,
}: {
  projectId: string;
  plan?: PaymentPlan;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = plan ? updatePaymentPlan.bind(null, plan.id) : createPaymentPlan.bind(null, projectId);
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, plan ? `Payment plan "${plan.name}" saved.` : "Payment plan added.");
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
        <h3 className="text-base text-ink">{plan ? "Edit" : "Add"} Payment Plan</h3>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <Field label="Plan Name" htmlFor="name" error={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          className={inputClass}
          defaultValue={plan?.name}
          placeholder="e.g. Standard Installment Plan"
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Booking Amount" htmlFor="bookingAmount">
          <input
            id="bookingAmount"
            name="bookingAmount"
            className={inputClass}
            defaultValue={plan?.bookingAmount ?? ""}
            placeholder="e.g. BDT 1,00,000"
          />
        </Field>
        <Field label="Down Payment" htmlFor="downPayment">
          <input
            id="downPayment"
            name="downPayment"
            className={inputClass}
            defaultValue={plan?.downPayment ?? ""}
            placeholder="e.g. 20% on booking"
          />
        </Field>
      </div>

      <Field label="Installment Information" htmlFor="installmentInfo">
        <RichTextEditor
          id="installmentInfo"
          name="installmentInfo"
          defaultValue={plan?.installmentInfo}
          size="sm"
          placeholder="e.g. 36 equal monthly installments starting from the booking month"
        />
      </Field>

      <Field label="Payment Description" htmlFor="description">
        <RichTextEditor
          id="description"
          name="description"
          defaultValue={plan?.description}
          size="sm"
          placeholder="Any additional notes about this payment plan"
        />
      </Field>

      <SubmitButton label={plan ? "Save Changes" : "Add Plan"} />
    </form>
  );
}
