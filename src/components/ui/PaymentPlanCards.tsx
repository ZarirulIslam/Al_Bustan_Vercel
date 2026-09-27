import type { PaymentPlan } from "@/lib/types";
import { RichText } from "@/components/ui/RichText";

// Read-only display shown on the public project detail page — admin
// management lives at /admin/projects/[id]/edit (see PaymentPlanManager).
// Only enabled plans ever reach this component (see
// getEnabledPaymentPlansForProject), so nothing here re-checks that.
export function PaymentPlanCards({ plans }: { plans: PaymentPlan[] }) {
  if (plans.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <div key={plan.id} className="rounded-lg border border-limestone-300 bg-white p-6 shadow-card">
          <h3 className="text-lg text-ink">{plan.name}</h3>

          {(plan.bookingAmount || plan.downPayment) && (
            <dl className="mt-4 space-y-2.5 border-t border-limestone-300 pt-4">
              {plan.bookingAmount && (
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-ink-soft">Booking Amount</dt>
                  <dd className="text-right font-medium text-ink">{plan.bookingAmount}</dd>
                </div>
              )}
              {plan.downPayment && (
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-ink-soft">Down Payment</dt>
                  <dd className="text-right font-medium text-ink">{plan.downPayment}</dd>
                </div>
              )}
            </dl>
          )}

          {plan.installmentInfo && (
            <RichText html={plan.installmentInfo} className="mt-4 text-sm text-ink-soft" />
          )}
          {plan.description && (
            <RichText html={plan.description} className="mt-3 text-xs text-ink-soft" />
          )}
        </div>
      ))}
    </div>
  );
}
