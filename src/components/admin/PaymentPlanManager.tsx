"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentPlanForm } from "@/components/admin/PaymentPlanForm";
import { deletePaymentPlan, togglePaymentPlanEnabled } from "@/app/admin/(dashboard)/projects/actions";
import type { PaymentPlan } from "@/lib/types";
import { useAdminAction } from "@/components/admin/AdminToaster";

export function PaymentPlanManager({ projectId, plans }: { projectId: string; plans: PaymentPlan[] }) {
  const { run, isPending } = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingPlan = editingId ? plans.find((p) => p.id === editingId) : undefined;
  const showForm = adding || Boolean(editingPlan);

  function closeForm() {
    setAdding(false);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <PaymentPlanForm
          key={editingId ?? "new"}
          projectId={projectId}
          plan={editingPlan}
          onCancel={closeForm}
          onSaved={closeForm}
        />
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
          + Add Payment Plan
        </Button>
      )}

      {plans.length === 0 ? (
        <EmptyState
          title="No payment plans yet"
          description="Add a payment plan to show booking amount, down payment and installment details on this project's public page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-limestone-300 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-medium text-ink">{plan.name}</h3>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => togglePaymentPlanEnabled(plan.id, !plan.enabled), plan.enabled ? "Payment plan disabled." : "Payment plan enabled.")}
                  className={
                    plan.enabled
                      ? "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                      : "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                  }
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${plan.enabled ? "bg-garden-500" : "bg-ink-soft/50"}`} />
                  {plan.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <dl className="mt-3 space-y-1.5 text-sm">
                {plan.bookingAmount && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Booking Amount</dt>
                    <dd className="text-right text-ink">{plan.bookingAmount}</dd>
                  </div>
                )}
                {plan.downPayment && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-soft">Down Payment</dt>
                    <dd className="text-right text-ink">{plan.downPayment}</dd>
                  </div>
                )}
              </dl>

              {plan.installmentInfo && (
                <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{plan.installmentInfo}</p>
              )}
              {plan.description && (
                <p className="mt-2 whitespace-pre-line text-xs text-ink-soft">{plan.description}</p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(plan.id);
                    setAdding(false);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(`Delete "${plan.name}"? This can't be undone.`)) {
                      run(() => deletePaymentPlan(plan.id), "Payment plan deleted.");
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
