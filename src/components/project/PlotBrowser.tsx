"use client";

import { PlotLayout, PlotLegend } from "@/components/project/PlotLayout";
import type { PlotGroup, PublicPlot } from "@/lib/types";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

const countBy = (list: PublicPlot[], status: PublicPlot["status"]) => list.filter((p) => p.status === status).length;

// One plot category (a block's size) for visitors: legend, counts and
// the layout. Shared by the project page's প্লট তালিকা section and the
// category's own page.
export function PlotBrowser({
  projectId,
  projectName,
  group,
  plots,
  layoutClassName,
}: {
  projectId: string;
  projectName: string;
  group: PlotGroup;
  plots: PublicPlot[];
  layoutClassName?: string;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <PlotLegend />
        <p className="text-sm text-ink-soft">
          মোট {bn(plots.length)} · খালি {bn(countBy(plots, "available"))} · বুকড {bn(countBy(plots, "reserved"))} ·
          বিক্রিত {bn(countBy(plots, "sold"))}
        </p>
      </div>

      <div className="mt-5">
        <PlotLayout
          key={group.id}
          projectId={projectId}
          projectName={projectName}
          categoryName={group.name}
          blockName={group.block}
          rows={group.rows}
          columns={group.columns}
          plots={plots}
          className={layoutClassName}
        />
      </div>
    </div>
  );
}
