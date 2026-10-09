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
// buyers see real availability at a glance.
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

  return (
    <div className="overflow-x-auto rounded-lg border border-limestone-300">
      <table className="w-full min-w-[640px] text-left text-sm">
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
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
