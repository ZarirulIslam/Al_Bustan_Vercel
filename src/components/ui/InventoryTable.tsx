import type { InventoryItem, InventoryStatus, ProjectCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SHARED_COPY, type ProjectLocale } from "@/lib/projectCopy";

const statusStyles: Record<InventoryStatus, string> = {
  available: "bg-garden-500 text-white",
  reserved: "bg-brass text-white",
  sold: "bg-limestone-300 text-ink-soft",
};

function InventoryStatusBadge({ status, label }: { status: InventoryStatus; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold tracking-wide shadow-sm",
        statusStyles[status]
      )}
    >
      {label}
    </span>
  );
}

// Read-only availability table shown on the public project detail
// page — admin management lives at /admin/projects/[id]/edit (see
// InventoryManager). Every item is shown, including sold ones, so
// buyers see real availability at a glance. Buyer columns (client,
// payment) appear once any booked/sold item has buyer info — the file
// number stays admin-only and is never shown here;
// an available item never shows buyer info, even if stale data is left
// on it.
export function InventoryTable({
  items,
  category,
  locale = "en",
}: {
  items: InventoryItem[];
  category: ProjectCategory;
  locale?: ProjectLocale;
}) {
  const t = SHARED_COPY[locale].inventory;
  if (items.length === 0) return null;

  const isFlat = category === "flat";
  const buyerOf = (item: InventoryItem) => (item.status === "available" ? null : item);
  const showBuyer = items.some((item) => {
    const b = buyerOf(item);
    return b && (b.clientName || b.paymentMode);
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-limestone-300">
      <table className={cn("w-full text-left text-sm", showBuyer ? "min-w-[860px]" : "min-w-[640px]")}>
        <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-semibold">{isFlat ? t.unitNo : t.plotNo}</th>
            <th className="px-4 py-3 font-semibold">{isFlat ? t.floor : t.block}</th>
            <th className="px-4 py-3 font-semibold">{t.size}</th>
            {isFlat ? (
              <>
                <th className="px-4 py-3 font-semibold">{t.bedBath}</th>
                <th className="px-4 py-3 font-semibold">{t.parking}</th>
              </>
            ) : (
              <th className="px-4 py-3 font-semibold">{t.roadWidth}</th>
            )}
            <th className="px-4 py-3 font-semibold">{t.facing}</th>
            <th className="px-4 py-3 font-semibold">{t.price}</th>
            <th className="px-4 py-3 font-semibold">{t.status}</th>
            {showBuyer && (
              <>
                <th className="px-4 py-3 font-semibold">{t.client}</th>
                <th className="px-4 py-3 font-semibold">{t.payment}</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const buyer = buyerOf(item);
            return (
              <tr key={item.id} className="border-b border-limestone-300 bg-white last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{item.code}</td>
                <td className="px-4 py-3 text-ink-soft">{(isFlat ? item.floor : item.block) || "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{item.size || "—"}</td>
                {isFlat ? (
                  <>
                    <td className="px-4 py-3 text-ink-soft">
                      {item.bedrooms || "—"}
                      {item.bathrooms ? ` / ${item.bathrooms}` : ""}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{item.parking || "—"}</td>
                  </>
                ) : (
                  <td className="px-4 py-3 text-ink-soft">{item.roadWidth || "—"}</td>
                )}
                <td className="px-4 py-3 text-ink-soft">{item.facing || "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{item.price || "—"}</td>
                <td className="px-4 py-3">
                  <InventoryStatusBadge status={item.status} label={t.statuses[item.status]} />
                </td>
                {showBuyer && (
                  <>
                    <td className="px-4 py-3 font-medium text-ink">{buyer?.clientName || "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {buyer?.paymentMode ? (
                        <>
                          <span className="font-medium text-ink">{t.paymentModes[buyer.paymentMode]}</span>
                          {buyer.paymentMode === "installment" && buyer.remainingInstallments !== null && (
                            <span className="mt-0.5 block text-xs">
                              {buyer.remainingInstallments === 0
                                ? t.paidInFull
                                : t.installmentsLeft(buyer.remainingInstallments, buyer.totalInstallments)}
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
