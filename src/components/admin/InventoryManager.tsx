"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InventoryItemForm } from "@/components/admin/InventoryItemForm";
import {
  deleteInventoryItem,
  deleteInventoryItems,
  deleteInventoryRange,
  updateInventoryItemStatus,
} from "@/app/admin/(dashboard)/projects/actions";
import { parseRange } from "@/lib/plotLayout";
import type { InventoryItem, InventoryStatus, PlotGroup, ProjectCategory } from "@/lib/types";
import { useAdminAction } from "@/components/admin/AdminToaster";

const selectClass =
  "rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500";

export function InventoryManager({
  projectId,
  category,
  items,
  groups = [],
  scopeGroupId,
}: {
  projectId: string;
  category: ProjectCategory;
  items: InventoryItem[];
  // Plot categories (land projects) — adds a Category column and lets
  // the form place plots on a layout.
  groups?: PlotGroup[];
  // Set when this list is one category's own list (items are that
  // category's plots): no Category column, range delete stays inside
  // the category, and plots are added on the layout grid instead.
  scopeGroupId?: string;
}) {
  const { run, isPending } = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rangeOpen, setRangeOpen] = useState(false);
  // Plot numbers repeat across categories, so a range delete is scoped
  // to one category by default.
  const emptyRange = { range: "", prefix: "", includeBooked: false, groupId: scopeGroupId ?? groups[0]?.id ?? "" };
  const showCategory = groups.length > 0 && !scopeGroupId;
  const [rangeValues, setRangeValues] = useState(emptyRange);

  const isFlat = category === "flat";
  const unitLabel = isFlat ? "Unit" : "Plot";
  const unitLabelLower = unitLabel.toLowerCase();

  const editingItem = editingId ? items.find((i) => i.id === editingId) : undefined;
  const showForm = adding || Boolean(editingItem);

  function closeForm() {
    setAdding(false);
    setEditingId(null);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return [item.code, item.block, item.floor, item.facing, item.clientName, item.fileNumber]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    });
  }, [items, search, statusFilter]);

  // Ticked rows that still exist (deleted ones drop out on refresh).
  const selectedItems = items.filter((i) => selected.has(i.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const isBooked = (i: InventoryItem) =>
    i.status !== "available" || Boolean(i.clientName || i.fileNumber || i.paymentMode);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of filtered) {
        if (allFilteredSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  }

  function deleteSelected() {
    const booked = selectedItems.filter(isBooked).length;
    const warning = booked ? `\n\n${booked} of them are booked/sold or have buyer info — they will be deleted too.` : "";
    if (!confirm(`Delete ${selectedItems.length} ${unitLabelLower}s? This can't be undone.${warning}`)) return;
    const ids = selectedItems.map((i) => i.id);
    run(async () => {
      const result = await deleteInventoryItems(projectId, ids);
      if (!("error" in result)) setSelected(new Set());
      return result;
    });
  }

  // Live count for the range delete, from the list already on screen.
  const range = rangeValues.range.trim() ? parseRange(rangeValues.range) : null;
  const rangeMatches = (() => {
    if (!range || "error" in range) return [];
    const prefix = rangeValues.prefix.trim();
    const wanted = new Set<string>();
    for (let n = range.from; n <= range.to; n++) wanted.add(prefix + String(n).padStart(range.pad, "0"));
    const g = rangeValues.groupId;
    return items.filter(
      (i) => wanted.has(i.code) && (!g || (g === "unplaced" ? !i.groupId : i.groupId === g))
    );
  })();
  const rangeBooked = rangeMatches.filter(isBooked).length;
  const rangeDeletes = rangeValues.includeBooked ? rangeMatches.length : rangeMatches.length - rangeBooked;

  function deleteRange() {
    const scope =
      rangeValues.groupId === "unplaced"
        ? " not on any layout"
        : rangeValues.groupId
          ? ` from "${groups.find((g) => g.id === rangeValues.groupId)?.name}"`
          : " from every category";
    const label = `${rangeValues.prefix.trim()}${rangeValues.range.trim()}${scope}`;
    if (!confirm(`Delete ${rangeDeletes} ${unitLabelLower}s (${label})? This can't be undone.`)) return;
    run(async () => {
      const result = await deleteInventoryRange(projectId, rangeValues);
      if (!("error" in result)) {
        setRangeOpen(false);
        setRangeValues(emptyRange);
      }
      return result;
    });
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <InventoryItemForm
          key={editingId ?? "new"}
          projectId={projectId}
          category={category}
          item={editingItem}
          groups={groups}
          onCancel={closeForm}
          onSaved={closeForm}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {!scopeGroupId && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
              + Add {unitLabel}
            </Button>
          )}
          {!isFlat && items.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setRangeOpen((open) => !open)}>
              {rangeOpen ? "Close range delete" : "Delete a range…"}
            </Button>
          )}
        </div>
      )}

      {rangeOpen && !showForm && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-5">
          <h4 className="text-base text-ink">Delete plots by number range</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {showCategory && (
              <label className="block">
                <span className="text-sm text-ink">Category</span>
                <select
                  value={rangeValues.groupId}
                  onChange={(e) => setRangeValues((v) => ({ ...v, groupId: e.target.value }))}
                  className="mt-1 w-full rounded border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-garden-500"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                  <option value="unplaced">Not on any layout</option>
                  <option value="">All categories</option>
                </select>
              </label>
            )}
            <label className="block">
              <span className="text-sm text-ink">Plot numbers</span>
              <input
                value={rangeValues.range}
                onChange={(e) => setRangeValues((v) => ({ ...v, range: e.target.value }))}
                placeholder="e.g. 001-532 or 10-50"
                className="mt-1 w-full rounded border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-garden-500"
                autoFocus
              />
              <span className="mt-1 block text-xs text-ink-soft">
                Write it the way the numbers look (001 if they have leading zeros).
              </span>
            </label>
            <label className="block">
              <span className="text-sm text-ink">Prefix (optional)</span>
              <input
                value={rangeValues.prefix}
                onChange={(e) => setRangeValues((v) => ({ ...v, prefix: e.target.value }))}
                placeholder="A-"
                className="mt-1 w-full rounded border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-garden-500"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={rangeValues.includeBooked}
              onChange={(e) => setRangeValues((v) => ({ ...v, includeBooked: e.target.checked }))}
            />
            Also delete booked/sold plots and ones with buyer info
          </label>
          {range && (
            <p
              className={
                "error" in range || rangeDeletes === 0
                  ? "rounded bg-white px-3 py-2 text-sm text-red-700"
                  : "rounded bg-white px-3 py-2 text-sm text-ink"
              }
            >
              {"error" in range
                ? range.error
                : rangeMatches.length === 0
                  ? "No plots with those numbers."
                  : `${rangeDeletes} of ${rangeMatches.length} matching plots will be deleted.${
                      !rangeValues.includeBooked && rangeBooked ? ` ${rangeBooked} booked/sold will be kept.` : ""
                    }`}
            </p>
          )}
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isPending || !range || "error" in range || rangeDeletes === 0}
            onClick={deleteRange}
          >
            {isPending ? "Deleting…" : `Delete ${rangeDeletes || ""} plots`}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={`No ${unitLabelLower}s yet`}
          description={
            scopeGroupId
              ? "Add plots on the layout above — + Add range, Quick add, or click an empty spot."
              : `Add individual ${unitLabelLower}s to track availability for this project.`
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder={`Search by ${unitLabelLower} number, ${isFlat ? "floor" : "block"}, client or file number…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[220px] flex-1 rounded-lg border border-limestone-300 bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-garden-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InventoryStatus | "all")}
              className={selectClass}
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm">
              <span className="font-medium text-ink">{selectedItems.length} selected</span>
              <Button type="button" variant="danger" size="sm" disabled={isPending} onClick={deleteSelected}>
                Delete selected
              </Button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs font-medium text-ink-soft hover:text-ink"
              >
                Clear selection
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="rounded-md border border-dashed border-limestone-300 px-6 py-8 text-center text-sm text-ink-soft">
              No {unitLabelLower}s match your search.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleAllFiltered}
                        aria-label={`Select all ${filtered.length} shown`}
                        title="Select all shown"
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">{unitLabel} No.</th>
                    {showCategory && <th className="px-4 py-3 font-semibold">Category</th>}
                    <th className="px-4 py-3 font-semibold">{isFlat ? "Floor" : "Block"}</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Facing</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-limestone-300 transition-colors duration-150 last:border-0 hover:bg-limestone-100/70"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggle(item.id)}
                          aria-label={`Select ${unitLabelLower} ${item.code}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">{item.code}</td>
                      {showCategory && (
                        <td className="px-4 py-3 text-ink-soft">
                          {groups.find((g) => g.id === item.groupId)?.name ?? "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 text-ink-soft">{(isFlat ? item.floor : item.block) || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">{item.size || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">{item.facing || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">{item.price || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">
                        {item.clientName || "—"}
                        {item.fileNumber && <span className="block text-xs">File {item.fileNumber}</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {item.paymentMode === "one_time"
                          ? "One-time"
                          : item.paymentMode === "installment"
                            ? `Installment · ${item.remainingInstallments ?? "?"}${
                                item.totalInstallments ? `/${item.totalInstallments}` : ""
                              } left`
                            : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={item.status}
                          disabled={isPending}
                          onChange={(e) =>
                            run(() => updateInventoryItemStatus(item.id, e.target.value as InventoryStatus), "Unit status updated.")
                          }
                          className={selectClass}
                        >
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="sold">Sold</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(item.id);
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
                              if (confirm(`Delete ${unitLabelLower} "${item.code}"? This can't be undone.`)) {
                                run(() => deleteInventoryItem(item.id), "Unit deleted.");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
