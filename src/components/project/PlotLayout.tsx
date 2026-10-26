"use client";

import { useEffect, useRef, useState } from "react";
import { PlotBookingForm } from "@/components/project/PlotBookingForm";
import { SHARED_COPY } from "@/lib/projectCopy";
import { plotsByCell } from "@/lib/plotLayout";
import type { InventoryStatus, PublicPlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = SHARED_COPY.bn.inventory;

const cellStyles: Record<InventoryStatus, string> = {
  available:
    "border-garden-500 bg-white text-garden-700 hover:-translate-y-0.5 hover:bg-garden-50 hover:shadow-card focus-visible:bg-garden-50",
  reserved: "border-brass bg-brass text-white hover:opacity-90",
  sold: "border-limestone-300 bg-limestone-300 text-ink-soft hover:opacity-90",
};

// Short label under the plot number in each cell.
const cellTag: Record<InventoryStatus, string | null> = {
  available: null,
  reserved: "বুকড",
  sold: "SOLD",
};

const statusBadge: Record<InventoryStatus, string> = {
  available: "bg-garden-500 text-white",
  reserved: "bg-brass text-white",
  sold: "bg-limestone-300 text-ink-soft",
};

export function PlotLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded border-2 border-garden-500 bg-white" /> {t.statuses.available}
      </span>
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded bg-brass" /> {t.statuses.reserved}
      </span>
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded bg-limestone-300" /> {t.statuses.sold}
      </span>
    </div>
  );
}

// Bus-seat-style plot map for one category: every plot in its spot on
// the layout grid, empty cells being roads / gaps. Clicking a plot opens
// its details — and, for a free plot, the booking form with the plot
// already filled in (sent to Leads & Inquiries).
export function PlotLayout({
  projectId,
  projectName,
  categoryName,
  rows,
  columns,
  plots,
  className,
}: {
  projectId: string;
  projectName: string;
  categoryName: string;
  rows: number;
  columns: number;
  plots: PublicPlot[];
  // Extra classes for the scroll box, e.g. a max height on the project page.
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<PublicPlot | null>(null);
  const cells = plotsByCell(plots);

  function open(plot: PublicPlot) {
    setSelected(plot);
    dialogRef.current?.showModal();
  }

  // After a booking is sent, leave the thank-you message up for a
  // moment, then close the popup.
  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => dialogRef.current?.close(), 3500);
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <>
      <div
        className={cn(
          "overflow-x-auto rounded-2xl border border-limestone-300/70 bg-limestone-100/60 p-4 sm:p-6",
          className
        )}
      >
        <div
          className="mx-auto grid w-max gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, 3.25rem)` }}
          role="group"
          aria-label={`${categoryName} — প্লট লেআউট`}
        >
          {Array.from({ length: rows * columns }, (_, i) => {
            const row = Math.floor(i / columns) + 1;
            const col = (i % columns) + 1;
            const plot = cells.at(row, col);
            if (!plot) return <span key={i} aria-hidden className="h-14" />;
            const tag = cellTag[plot.status];
            return (
              <button
                key={i}
                type="button"
                onClick={() => open(plot)}
                aria-label={`প্লট ${plot.code} — ${t.statuses[plot.status]}`}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-lg border-2 px-0.5 text-sm font-bold leading-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-garden-500 focus-visible:ring-offset-1",
                  cellStyles[plot.status]
                )}
              >
                <span className="max-w-full truncate">{plot.code}</span>
                {tag && <span className="text-[9px] font-semibold tracking-wide opacity-90">{tag}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-label={selected ? `প্লট ${selected.code}` : "প্লট"}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        // Forget the plot on close (X, Esc, backdrop or after booking), so
        // opening it again shows a fresh form, not the old thank-you.
        onClose={() => {
          if (closeTimer.current) clearTimeout(closeTimer.current);
          setSelected(null);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white p-0 text-ink shadow-card-hover backdrop:bg-garden-900/60"
      >
        {selected && (
          <div lang="bn" className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-ink-soft">
                  {projectName} · {categoryName}
                </p>
                <h3 className="mt-1 text-2xl font-bold">
                  {t.plotNo} {selected.code}
                </h3>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded px-2.5 py-1 text-xs font-semibold",
                    statusBadge[selected.status]
                  )}
                >
                  {t.statuses[selected.status]}
                </span>
              </div>
              <button
                type="button"
                aria-label="বন্ধ করুন"
                onClick={() => dialogRef.current?.close()}
                className="-mr-2 -mt-1 rounded p-2 text-ink-soft transition-colors hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label={t.size} value={selected.size || categoryName} />
              <Detail label={t.block} value={selected.block} />
              <Detail label={t.facing} value={selected.facing} />
              <Detail label={t.roadWidth} value={selected.roadWidth} />
              <Detail label={t.price} value={selected.price} />
              {selected.status !== "available" && (
                <>
                  <Detail label={t.client} value={selected.clientName} />
                  <Detail
                    label={t.payment}
                    value={
                      selected.paymentMode === "installment"
                        ? [
                            t.paymentModes.installment,
                            selected.remainingInstallments === null
                              ? null
                              : selected.remainingInstallments === 0
                                ? t.paidInFull
                                : t.installmentsLeft(selected.remainingInstallments, selected.totalInstallments),
                          ]
                            .filter(Boolean)
                            .join(" — ")
                        : selected.paymentMode
                          ? t.paymentModes[selected.paymentMode]
                          : null
                    }
                  />
                </>
              )}
            </dl>

            {selected.status === "available" ? (
              <div className="mt-7 border-t border-limestone-300 pt-6">
                <h4 className="text-lg font-semibold">এই প্লটটি বুক করুন</h4>
                <p className="mb-5 mt-1 text-sm text-ink-soft">
                  ফর্মটি পূরণ করে পাঠান — আমাদের প্রতিনিধি দ্রুত আপনার সাথে যোগাযোগ করবেন।
                </p>
                <PlotBookingForm
                  key={selected.id}
                  projectId={projectId}
                  projectName={projectName}
                  blocks={[]}
                  plot={{
                    id: selected.id,
                    code: selected.code,
                    block: selected.block,
                    size: selected.size || categoryName,
                    category: categoryName,
                  }}
                  onSuccess={closeSoon}
                />
              </div>
            ) : (
              <p className="mt-7 rounded-xl bg-limestone-100 px-4 py-3 text-sm text-ink-soft">
                এই প্লটটি ইতিমধ্যে {selected.status === "sold" ? "বিক্রি" : "বুক"} হয়ে গেছে। খালি প্লটগুলো সবুজ বর্ডারে দেখানো
                হয়েছে।
              </p>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
