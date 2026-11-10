"use client";

import { useEffect, useRef, useState } from "react";
import { PlotBookingForm } from "@/components/project/PlotBookingForm";
import { SHARED_COPY } from "@/lib/projectCopy";
import { blockLabel, groupFullName, plotsByCell } from "@/lib/plotLayout";
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
  blockName,
  rows,
  columns,
  plots,
  className,
}: {
  projectId: string;
  projectName: string;
  categoryName: string;
  // The category's block (main category) — used when a plot has no
  // block of its own.
  blockName?: string | null;
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
  const fullName = groupFullName({ block: blockName ?? null, name: categoryName });
  const blockOf = (plot: PublicPlot) => plot.block || (blockName ? blockLabel(blockName) : null);

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
          "overflow-x-auto overscroll-x-contain rounded-2xl border border-limestone-300/70 bg-limestone-100/60 p-3 sm:p-6",
          className
        )}
      >
        <div
          className="mx-auto grid w-max gap-1 [--cell:2.75rem] sm:gap-1.5 sm:[--cell:3.25rem]"
          style={{ gridTemplateColumns: `repeat(${columns}, var(--cell))` }}
          role="group"
          aria-label={`${fullName} — প্লট লেআউট`}
        >
          {Array.from({ length: rows * columns }, (_, i) => {
            const row = Math.floor(i / columns) + 1;
            const col = (i % columns) + 1;
            const plot = cells.at(row, col);
            if (!plot) return <span key={i} aria-hidden className="h-12 sm:h-14" />;
            const tag = cellTag[plot.status];
            return (
              <button
                key={i}
                type="button"
                onClick={() => open(plot)}
                aria-label={`প্লট ${plot.code} — ${t.statuses[plot.status]}`}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded-lg border-2 px-0.5 text-xs font-bold leading-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-garden-500 focus-visible:ring-offset-1 sm:h-14 sm:text-sm",
                  cellStyles[plot.status]
                )}
              >
                <span className="max-w-full truncate">{plot.code}</span>
                {tag && <span className="text-[8px] font-semibold tracking-wide opacity-90 sm:text-[9px]">{tag}</span>}
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
          <div lang="bn" className="max-h-[85dvh] overflow-y-auto p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-ink-soft">
                  {projectName} · {fullName}
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

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:gap-x-6">
              <Detail label={t.size} value={selected.size || categoryName} />
              <Detail label={t.block} value={blockOf(selected)} />
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
                    block: blockOf(selected),
                    size: selected.size || categoryName,
                    category: categoryName,
                  }}
                  onSuccess={closeSoon}
                />
              </div>
            ) : (
              <div className="mt-7">
                {/* Congratulations to the buyer (name is public; file number never is). */}
                <div className="relative overflow-hidden rounded-2xl border border-brass-light/40 bg-gradient-to-br from-brass-50 via-white to-garden-50 px-5 py-5 text-center sm:px-6">
                  <span
                    aria-hidden
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brass text-white shadow-card"
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20 9.5 7.5l7 7L4 20Z" />
                      <path d="M14 4.5c.5 1 .5 2-.5 3M19.5 10c-1-.5-2-.5-3 .5M17 3v1.5M21 7h-1.5M20 14l1 1" />
                    </svg>
                  </span>
                  {/* Bangla first, then English. */}
                  <p className="mt-3 text-xl font-bold text-garden-700">
                    অভিনন্দন{selected.clientName ? `, ${selected.clientName}` : ""}!
                  </p>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {selected.status === "sold"
                      ? `প্লট ${selected.code} এখন আপনার। আল বুস্তান পরিবারে আপনাকে স্বাগতম।`
                      : `প্লট ${selected.code} আপনার নামে বুক করা হয়েছে। আল বুস্তান পরিবারে আপনাকে স্বাগতম।`}
                  </p>
                  <div aria-hidden className="mx-auto my-3.5 h-px w-16 bg-brass-light/50" />
                  <div lang="en">
                    <p className="font-display text-lg font-semibold text-garden-700">
                      Congratulations{selected.clientName ? `, ${selected.clientName}` : ""}!
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {selected.status === "sold"
                        ? `Plot ${selected.code} is now yours. Welcome to the Al Bustan family.`
                        : `Plot ${selected.code} has been booked in your name. Welcome to the Al Bustan family.`}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-center text-sm text-ink-soft">
                  আপনিও প্লট খুঁজছেন? সবুজ বর্ডারের খালি প্লটগুলো থেকে পছন্দেরটি বেছে নিন।
                  <span lang="en" className="mt-0.5 block text-xs">
                    Looking for a plot too? Pick any free plot with a green border.
                  </span>
                </p>
              </div>
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
