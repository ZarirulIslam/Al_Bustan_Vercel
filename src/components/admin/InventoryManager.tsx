"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InventoryItemForm } from "@/components/admin/InventoryItemForm";
import { deleteInventoryItem, updateInventoryItemStatus } from "@/app/admin/(dashboard)/projects/actions";
import type { InventoryItem, InventoryStatus, ProjectCategory } from "@/lib/types";

const selectClass =
  "rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500";

export function InventoryManager({
  projectId,
  category,
  items,
}: {
  projectId: string;
  category: ProjectCategory;
  items: InventoryItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "all">("all");

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
      return [item.code, item.block, item.floor, item.facing]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-4">
      {showForm ? (
        <InventoryItemForm
          key={editingId ?? "new"}
          projectId={projectId}
          category={category}
          item={editingItem}
          onCancel={closeForm}
          onSaved={closeForm}
        />
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
          + Add {unitLabel}
        </Button>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={`No ${unitLabelLower}s yet`}
          description={`Add individual ${unitLabelLower}s to track availability for this project.`}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder={`Search by ${unitLabelLower} number, ${isFlat ? "floor" : "block"} or facing…`}
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

          {filtered.length === 0 ? (
            <p className="rounded-md border border-dashed border-limestone-300 px-6 py-8 text-center text-sm text-ink-soft">
              No {unitLabelLower}s match your search.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{unitLabel} No.</th>
                    <th className="px-4 py-3 font-semibold">{isFlat ? "Floor" : "Block"}</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Facing</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
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
                      <td className="px-4 py-3 font-medium text-ink">{item.code}</td>
                      <td className="px-4 py-3 text-ink-soft">{(isFlat ? item.floor : item.block) || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">{item.size || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">{item.facing || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">{item.price || "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={item.status}
                          disabled={isPending}
                          onChange={(e) =>
                            startTransition(() =>
                              updateInventoryItemStatus(item.id, e.target.value as InventoryStatus)
                            )
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
                                startTransition(() => deleteInventoryItem(item.id));
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
