"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { GENERIC_ERROR, useAdminToast } from "@/components/admin/AdminToaster";
import { addPlotRange, deletePlotRange } from "@/app/admin/(dashboard)/projects/actions";
import { MAX_GRID } from "@/lib/admin/plotGroupSchema";
import { parseNumberList, parseRange, planRangeFill, rangeCodeSets } from "@/lib/plotLayout";
import type { InventoryItem, PlotGroup } from "@/lib/types";

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-garden-500";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-ink">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

// "Add range" for a plot category: type 1-532 and every plot is created
// and dropped into the empty cells, left→right, top→bottom, leaving the
// road rows/columns empty. A live preview shows what will happen before
// saving. "Delete range" undoes it (free plots only).
export function PlotRangePanel({
  group,
  items,
  onClose,
}: {
  group: PlotGroup;
  // Every plot of the project — numbers already used are skipped.
  items: InventoryItem[];
  onClose: () => void;
}) {
  const toast = useAdminToast();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ range: "", prefix: "", size: group.name, block: "", skipRows: "", skipCols: "" });
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const range = values.range.trim() ? parseRange(values.range) : null;
  const codeSets = rangeCodeSets(items, group.id, values.size);
  const plan =
    range && !("error" in range)
      ? planRangeFill({
          ...range,
          prefix: values.prefix.trim(),
          existingCodes: codeSets.existingCodes,
          unplacedCodes: new Set(codeSets.unplaced.map((i) => i.code)),
          occupied: items.filter((i) => i.groupId === group.id),
          rows: group.rows,
          columns: group.columns,
          skipRows: parseNumberList(values.skipRows),
          skipCols: parseNumberList(values.skipCols),
          maxRows: MAX_GRID,
        })
      : null;

  let preview: { tone: "ok" | "error"; text: string } | null = null;
  if (range && "error" in range) preview = { tone: "error", text: range.error };
  else if (plan && "error" in plan) preview = { tone: "error", text: plan.error };
  else if (plan && range && !("error" in range)) {
    const first = plan.placements[0]?.code;
    const last = plan.placements[plan.placements.length - 1]?.code;
    const moved = plan.placements.filter((p) => p.existing).length;
    const added = plan.placements.length - moved;
    preview =
      plan.placements.length === 0
        ? { tone: "error", text: "All of those plot numbers are already in this category." }
        : {
            tone: "ok",
            text: [
              `Plots ${first} … ${last}:`,
              added ? `${added} new plots will be added.` : "",
              moved ? `${moved} existing plots (not on any layout yet) will be placed here, keeping their status and buyer info.` : "",
              plan.skipped ? `${plan.skipped} are already in this category and will be skipped.` : "",
              plan.rows > group.rows ? `The layout grows from ${group.rows} to ${plan.rows} rows.` : "",
            ]
              .filter(Boolean)
              .join(" "),
          };
  }

  function submit(kind: "add" | "delete") {
    if (kind === "delete" && !confirm(`Delete free plots ${values.prefix}${values.range} from "${group.name}"? Booked and sold plots are kept.`)) {
      return;
    }
    startTransition(async () => {
      try {
        const result =
          kind === "add"
            ? await addPlotRange(group.id, values)
            : await deletePlotRange(group.id, { range: values.range, prefix: values.prefix });
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        if ("message" in result && result.message) toast.success(result.message);
        onClose();
      } catch (error) {
        console.error(error);
        toast.error(GENERIC_ERROR);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-garden-300 bg-garden-50/40 p-5">
      <div className="flex items-center justify-between">
        <h4 className="text-base text-ink">Add a range of plots to “{group.name}”</h4>
        <button type="button" onClick={onClose} className="text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Plot numbers" hint="e.g. 1-532 (or 001-532 for 001, 002…). Each category can start from 1.">
          <input value={values.range} onChange={set("range")} className={inputClass} placeholder="1-532" autoFocus />
        </Field>
        <Field label="Prefix (optional)" hint="e.g. A- gives A-1, A-2…">
          <input value={values.prefix} onChange={set("prefix")} className={inputClass} placeholder="A-" />
        </Field>
        <Field label="Size for all (optional)">
          <input value={values.size} onChange={set("size")} className={inputClass} placeholder="৩ কাঠা" />
        </Field>
        <Field label="Block for all (optional)">
          <input value={values.block} onChange={set("block")} className={inputClass} placeholder="Block A" />
        </Field>
        <Field label="Road rows (leave empty)" hint="Row numbers, e.g. 5, 10">
          <input value={values.skipRows} onChange={set("skipRows")} className={inputClass} placeholder="5, 10" />
        </Field>
        <Field label="Road columns (leave empty)" hint="Column numbers, e.g. 6">
          <input value={values.skipCols} onChange={set("skipCols")} className={inputClass} placeholder="6" />
        </Field>
      </div>

      {preview && (
        <p
          className={
            preview.tone === "ok"
              ? "rounded bg-white px-3 py-2 text-sm text-garden-700"
              : "rounded bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {preview.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={isPending || !plan || "error" in plan || plan.placements.length === 0}
          onClick={() => submit("add")}
        >
          {isPending ? "Working…" : "Add plots"}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isPending || !range || "error" in range}
          onClick={() => submit("delete")}
        >
          Delete this range
        </Button>
        <span className="text-xs text-ink-soft">
          Plots fill empty spots left → right, top → bottom. Existing plots stay where they are.
        </span>
      </div>
    </div>
  );
}
