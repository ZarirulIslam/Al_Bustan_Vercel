"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { InventoryItemForm } from "@/components/admin/InventoryItemForm";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { PlotGroupForm } from "@/components/admin/PlotGroupForm";
import { PlotRangePanel } from "@/components/admin/PlotRangePanel";
import { useAdminAction, useAdminToast, GENERIC_ERROR } from "@/components/admin/AdminToaster";
import {
  deleteInventoryItem,
  deletePlotGroup,
  movePlotGroup,
  quickAddPlot,
} from "@/app/admin/(dashboard)/projects/actions";
import { nextPlotCode, plotsByCell, suggestNextCode } from "@/lib/plotLayout";
import type { InventoryItem, InventoryStatus, PlotGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

const cellStyles: Record<InventoryStatus, string> = {
  available: "border-garden-500 bg-white text-garden-700 hover:bg-garden-50",
  reserved: "border-brass bg-brass text-white hover:opacity-90",
  sold: "border-limestone-300 bg-limestone-300 text-ink-soft hover:opacity-90",
};

type Panel = { mode: "edit"; itemId: string } | { mode: "new"; gridRow: number; gridCol: number } | null;

// Land editor → প্লট তালিকা. One tab per plot category (৩ কাঠা,
// বাণিজ্যিক, …), each a rows × columns grid that mirrors the public
// layout page. Click an empty cell to add a plot there (or, in quick-add
// mode, to drop in the next number instantly); click a plot to edit its
// details, buyer info or position. Empty cells are roads / gaps.
export function PlotLayoutEditor({
  projectId,
  projectSlug,
  published,
  groups,
  items,
}: {
  projectId: string;
  projectSlug: string;
  published: boolean;
  groups: PlotGroup[];
  items: InventoryItem[];
}) {
  const toast = useAdminToast();
  const { run, isPending: isRunning } = useAdminAction();
  const [isAdding, startAdding] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(groups[0]?.id ?? null);
  const [groupForm, setGroupForm] = useState<"new" | "edit" | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [quick, setQuick] = useState(false);
  const [showRange, setShowRange] = useState(false);
  const [nextCode, setNextCode] = useState("1");
  const panelRef = useRef<HTMLDivElement>(null);

  const group = groups.find((g) => g.id === selectedId) ?? groups[0];
  const groupItems = group ? items.filter((i) => i.groupId === group.id) : [];
  const cells = plotsByCell(groupItems);
  const unplaced = items.filter((i) => !i.groupId);
  const busy = isRunning || isAdding;

  // A newly created category arrives as the last one — open it.
  const groupCount = useRef(groups.length);
  useEffect(() => {
    if (groups.length > groupCount.current) setSelectedId(groups[groups.length - 1].id);
    groupCount.current = groups.length;
  }, [groups]);

  // Fresh number suggestion whenever the category changes.
  useEffect(() => {
    setNextCode(suggestNextCode(groupItems));
    setPanel(null);
    setShowRange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id]);

  useEffect(() => {
    if (panel) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [panel]);

  function onEmptyCell(gridRow: number, gridCol: number) {
    if (!group) return;
    if (!quick) {
      setPanel({ mode: "new", gridRow, gridCol });
      return;
    }
    const code = nextCode;
    startAdding(async () => {
      try {
        const result = await quickAddPlot(group.id, gridRow, gridCol, code);
        if (result?.error) toast.error(result.error);
        else setNextCode(nextPlotCode(code));
      } catch (error) {
        console.error(error);
        toast.error(GENERIC_ERROR);
      }
    });
  }

  const editingItem = panel?.mode === "edit" ? items.find((i) => i.id === panel.itemId) : undefined;
  const count = (status: InventoryStatus) => groupItems.filter((i) => i.status === status).length;

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              setSelectedId(g.id);
              setGroupForm(null);
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              g.id === group?.id
                ? "border-garden-500 bg-garden-500 text-white"
                : "border-limestone-300 bg-white text-ink hover:border-garden-500"
            )}
          >
            {g.name}
            <span className="ml-1.5 text-xs opacity-75">{items.filter((i) => i.groupId === g.id).length}</span>
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setGroupForm("new")}>
          + Category
        </Button>
      </div>

      {groupForm && (
        <PlotGroupForm
          key={groupForm === "edit" ? group?.id : "new"}
          projectId={projectId}
          group={groupForm === "edit" ? group : undefined}
          onCancel={() => setGroupForm(null)}
          onSaved={() => setGroupForm(null)}
        />
      )}

      {!group ? (
        !groupForm && (
          <p className="rounded-lg border border-dashed border-limestone-300 bg-limestone-100 px-4 py-6 text-center text-sm text-ink-soft">
            Add a category (e.g. ৩ কাঠা, ৫ কাঠা, বাণিজ্যিক) to start drawing its plot layout. Each category gets its own
            page on the website.
          </p>
        )
      ) : (
        <div className="space-y-4 rounded-xl border border-limestone-300 bg-white p-5 shadow-card">
          {/* Category header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg text-ink">{group.name}</h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                {group.rows} rows × {group.columns} columns · {groupItems.length} plots — {count("available")} available,{" "}
                {count("reserved")} reserved, {count("sold")} sold
              </p>
              {published && (
                <Link
                  href={`/projects/${projectSlug}/plots/${group.slug}`}
                  target="_blank"
                  className="mt-1 inline-block text-xs font-medium text-garden-700 hover:underline"
                >
                  View page ↗
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => run(() => movePlotGroup(group.id, "up"))}>
                ←
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => run(() => movePlotGroup(group.id, "down"))}>
                →
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setGroupForm("edit")}>
                Edit category
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (
                    confirm(
                      `Delete the "${group.name}" category? Its ${groupItems.length} plots are kept (with their buyer info) but taken off the layout, so they won't show on the site until you place them in a category again (+ Add range with their numbers).`
                    )
                  ) {
                    run(() => deletePlotGroup(group.id), "Category deleted.");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>

          {showRange ? (
            <PlotRangePanel group={group} items={items} onClose={() => setShowRange(false)} />
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowRange(true)}>
              + Add range (e.g. 1-532)
            </Button>
          )}

          {/* Quick add */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-limestone-100 px-4 py-3 text-sm">
            <label className="flex items-center gap-2 font-medium text-ink">
              <input type="checkbox" checked={quick} onChange={(e) => setQuick(e.target.checked)} />
              Quick add
            </label>
            {quick ? (
              <label className="flex items-center gap-2 text-ink-soft">
                Next plot number
                <input
                  value={nextCode}
                  onChange={(e) => setNextCode(e.target.value)}
                  className="w-24 rounded border border-limestone-300 bg-white px-2.5 py-1 text-sm text-ink outline-none focus:border-garden-500"
                />
                <span className="text-xs">— click empty spots in order; the number goes up by itself.</span>
              </label>
            ) : (
              <span className="text-xs text-ink-soft">
                Click an empty spot to add a plot there, or a plot to edit it. Leave roads empty.
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="overflow-x-auto pb-2">
            <div
              className="grid w-max gap-1"
              style={{ gridTemplateColumns: `1.5rem repeat(${group.columns}, 2.75rem)` }}
            >
              <span />
              {Array.from({ length: group.columns }, (_, c) => (
                <span key={c} className="text-center text-[10px] text-ink-soft">
                  {c + 1}
                </span>
              ))}
              {Array.from({ length: group.rows }, (_, r) => {
                const row = r + 1;
                return [
                  <span key={`r${row}`} className="self-center text-right text-[10px] text-ink-soft">
                    {row}
                  </span>,
                  ...Array.from({ length: group.columns }, (_, c) => {
                    const col = c + 1;
                    const plot = cells.at(row, col);
                    const selected =
                      (panel?.mode === "edit" && plot?.id === panel.itemId) ||
                      (panel?.mode === "new" && panel.gridRow === row && panel.gridCol === col);
                    return plot ? (
                      <button
                        key={`${row}:${col}`}
                        type="button"
                        title={`${plot.code}${plot.clientName ? ` — ${plot.clientName}` : ""}`}
                        onClick={() => setPanel({ mode: "edit", itemId: plot.id })}
                        className={cn(
                          "h-11 truncate rounded border-2 px-0.5 text-xs font-semibold transition",
                          cellStyles[plot.status],
                          selected && "ring-2 ring-ink ring-offset-1"
                        )}
                      >
                        {plot.code}
                      </button>
                    ) : (
                      <button
                        key={`${row}:${col}`}
                        type="button"
                        aria-label={`Add plot at row ${row}, column ${col}`}
                        disabled={busy}
                        onClick={() => onEmptyCell(row, col)}
                        className={cn(
                          "h-11 rounded border border-dashed border-limestone-300 text-limestone-300 transition hover:border-garden-500 hover:text-garden-500 disabled:cursor-wait",
                          selected && "border-solid border-ink text-ink"
                        )}
                      >
                        +
                      </button>
                    );
                  }),
                ];
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border-2 border-garden-500 bg-white" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-brass" /> Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-limestone-300" /> Sold
            </span>
          </div>
        </div>
      )}

      {/* Add / edit panel */}
      {panel && group && (
        <div ref={panelRef} className="space-y-3">
          <InventoryItemForm
            key={panel.mode === "edit" ? panel.itemId : `new-${panel.gridRow}-${panel.gridCol}`}
            projectId={projectId}
            category="land_plot"
            item={editingItem}
            groups={groups}
            placement={panel.mode === "new" ? { groupId: group.id, ...panel } : undefined}
            defaultCode={panel.mode === "new" ? nextCode : undefined}
            onCancel={() => setPanel(null)}
            onSaved={() => {
              if (panel.mode === "new") setNextCode((code) => nextPlotCode(code));
              setPanel(null);
            }}
          />
          {editingItem && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => {
                if (confirm(`Delete plot "${editingItem.code}"? This can't be undone.`)) {
                  run(() => deleteInventoryItem(editingItem.id), "Plot deleted.");
                  setPanel(null);
                }
              }}
            >
              Delete plot {editingItem.code}
            </Button>
          )}
        </div>
      )}

      {/* This category's own plot list — search, status, bulk and
          range delete, all limited to this category. */}
      {group && (
        <div className="space-y-3 rounded-xl border border-limestone-300 bg-white p-5 shadow-card">
          <h3 className="text-base text-ink">
            Plots in “{group.name}” <span className="text-sm text-ink-soft">({groupItems.length})</span>
          </h3>
          <InventoryManager
            key={group.id}
            projectId={projectId}
            category="land_plot"
            items={groupItems}
            groups={groups}
            scopeGroupId={group.id}
          />
        </div>
      )}

      {/* Plots not on any layout yet */}
      {groups.length > 0 && unplaced.length > 0 && (
        <div className="rounded-lg border border-dashed border-limestone-300 px-4 py-3 text-sm">
          <p className="text-ink">
            <strong>{unplaced.length} plots are not on any layout</strong>, so visitors can&apos;t see them on the site.
          </p>
          <p className="mt-1 text-ink-soft">
            To place them all at once, open a category and use <strong>+ Add range</strong> with their numbers
            (e.g. {unplaced[0].code}-{unplaced[unplaced.length - 1].code}) — they keep their status and buyer info.
            Or click one to place it by hand:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {unplaced.map((plot) => (
              <button
                key={plot.id}
                type="button"
                onClick={() => setPanel({ mode: "edit", itemId: plot.id })}
                className={cn("rounded border-2 px-2 py-0.5 text-xs font-semibold", cellStyles[plot.status])}
              >
                {plot.code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
