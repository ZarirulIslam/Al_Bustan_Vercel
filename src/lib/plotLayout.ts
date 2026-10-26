import type { InventoryItem, PlotGroup } from "@/lib/types";

// Helpers shared by the admin layout editor and the public plot layout
// pages (bus-seat-style grids of plots per category).

// Hash that opens one category's tab on the project page (used by the
// category shortcuts higher up), e.g. #plots-3-katha. Lives here, not in
// the client component, so the server-rendered page can call it too.
export const plotTabHash = (group: Pick<PlotGroup, "slug" | "id">) => `plots-${group.slug || group.id}`;

const cellKey = (row: number, col: number) => `${row}:${col}`;

// Plots of one category keyed by their grid cell.
export function plotsByCell<T extends { gridRow: number | null; gridCol: number | null }>(items: T[]) {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item.gridRow && item.gridCol) map.set(cellKey(item.gridRow, item.gridCol), item);
  }
  return {
    at: (row: number, col: number) => map.get(cellKey(row, col)),
  };
}

// "A-09" → "A-10", "12" → "13". Codes without a trailing number are
// returned unchanged.
export function nextPlotCode(code: string): string {
  const match = code.match(/^(.*?)(\d+)$/);
  if (!match) return code;
  const [, prefix, digits] = match;
  return prefix + String(Number(digits) + 1).padStart(digits.length, "0");
}

// Suggested number for the next plot added to a category: one past the
// highest numbered plot already in it.
export function suggestNextCode(items: InventoryItem[]): string {
  let best: { code: string; n: number } | null = null;
  for (const item of items) {
    const match = item.code.match(/(\d+)$/);
    if (match && (!best || Number(match[1]) > best.n)) best = { code: item.code, n: Number(match[1]) };
  }
  return best ? nextPlotCode(best.code) : "1";
}

// --- Range add ("1-532" → plots 1…532, filled into empty cells) ---

// Plot numbers are per category: ৩ কাঠা and ৫ কাঠা can both start at 1.
// So a range only skips numbers already in *this* category. Existing
// plots that aren't on any layout are reused (placed, not duplicated)
// when their size matches the range's size — or any size when the range
// has none.
export function rangeCodeSets<T extends { code: string; groupId: string | null; size: string | null }>(
  items: T[],
  groupId: string,
  size: string
) {
  const norm = (s: string | null) => (s ?? "").trim().toLowerCase();
  const wantedSize = norm(size);
  return {
    existingCodes: new Set(items.filter((i) => i.groupId === groupId).map((i) => i.code)),
    unplaced: items.filter((i) => !i.groupId && (!wantedSize || norm(i.size) === wantedSize)),
  };
}

export const MAX_RANGE = 2000;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toAscii = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

// "1-532", "001 – 120" or Bangla "১-৫৩২". A leading zero ("001") pads
// every number to that width.
export function parseRange(text: string): { from: number; to: number; pad: number } | { error: string } {
  const match = toAscii(text).trim().match(/^(\d{1,6})\s*[-–—]\s*(\d{1,6})$/);
  if (!match) return { error: "Write the range like 1-532." };
  const from = Number(match[1]);
  const to = Number(match[2]);
  if (to < from) return { error: "The second number must be the bigger one." };
  if (to - from + 1 > MAX_RANGE) return { error: `At most ${MAX_RANGE} plots at a time.` };
  return { from, to, pad: match[1].startsWith("0") ? match[1].length : 0 };
}

// "3, 7" → [3, 7] — rows/columns to keep empty as roads.
export function parseNumberList(text: string): number[] {
  return toAscii(text)
    .split(/[,\s]+/)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

// Where each plot of a range goes: empty cells left→right, top→bottom,
// skipping road rows/columns. Codes the project already has are skipped
// — unless they're in `unplacedCodes` (existing plots not on any
// layout), which are placed instead of created (`existing: true`).
// Adds rows at the bottom when the grid runs out of space.
export type RangePlacement = { code: string; gridRow: number; gridCol: number; existing: boolean };

export function planRangeFill({
  from,
  to,
  pad,
  prefix,
  existingCodes,
  unplacedCodes = new Set(),
  occupied,
  rows,
  columns,
  skipRows,
  skipCols,
  maxRows,
}: {
  from: number;
  to: number;
  pad: number;
  prefix: string;
  existingCodes: Set<string>;
  unplacedCodes?: Set<string>;
  occupied: { gridRow: number | null; gridCol: number | null }[];
  rows: number;
  columns: number;
  skipRows: number[];
  skipCols: number[];
  maxRows: number;
}): { placements: RangePlacement[]; skipped: number; rows: number } | { error: string } {
  const taken = new Set(occupied.filter((c) => c.gridRow && c.gridCol).map((c) => cellKey(c.gridRow!, c.gridCol!)));
  const usableCols = Array.from({ length: columns }, (_, i) => i + 1).filter((c) => !skipCols.includes(c));
  if (usableCols.length === 0) return { error: "Every column is marked as a road." };

  const codes: string[] = [];
  let skipped = 0;
  for (let n = from; n <= to; n++) {
    const code = prefix + String(n).padStart(pad, "0");
    if (existingCodes.has(code) && !unplacedCodes.has(code)) skipped++;
    else codes.push(code);
  }

  const placements: RangePlacement[] = [];
  let row = 1;
  while (placements.length < codes.length) {
    if (row > maxRows) {
      return { error: `Not enough room — that needs more than ${maxRows} rows. Add more columns to the category first.` };
    }
    if (!skipRows.includes(row)) {
      for (const col of usableCols) {
        if (placements.length === codes.length) break;
        if (!taken.has(cellKey(row, col))) {
          const code = codes[placements.length];
          placements.push({ code, gridRow: row, gridCol: col, existing: unplacedCodes.has(code) });
        }
      }
    }
    row++;
  }

  const lastRow = placements.reduce((max, p) => Math.max(max, p.gridRow), 0);
  return { placements, skipped, rows: Math.max(rows, lastRow) };
}
