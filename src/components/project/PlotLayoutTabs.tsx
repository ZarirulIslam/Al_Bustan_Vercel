"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlotLayout, PlotLegend } from "@/components/project/PlotLayout";
import type { PlotGroup, PublicPlot } from "@/lib/types";
import { plotTabHash } from "@/lib/plotLayout";
import { cn } from "@/lib/utils";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

// প্লট তালিকা section of the land project page: one tab per plot
// category with its layout right here (in a scroll box, so a 500-plot
// layout doesn't take over the page) and a link to the category's own
// full page.

export function PlotLayoutTabs({
  projectId,
  projectName,
  projectSlug,
  sections,
}: {
  projectId: string;
  projectName: string;
  projectSlug: string;
  sections: { group: PlotGroup; plots: PublicPlot[] }[];
}) {
  const [activeId, setActiveId] = useState(sections[0].group.id);
  const active = sections.find((s) => s.group.id === activeId) ?? sections[0];
  const { group, plots } = active;
  const free = (list: PublicPlot[]) => list.filter((p) => p.status === "available").length;

  useEffect(() => {
    function openFromHash() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const match = sections.find((s) => plotTabHash(s.group) === hash);
      if (!match) return;
      setActiveId(match.group.id);
      document.getElementById("plot-list")?.scrollIntoView({ behavior: "smooth" });
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [sections]);

  return (
    <div>
      {/* Shown even for a single category, so visitors see what's on offer. */}
      <div className="-mx-4 overflow-x-auto px-4">
        <div role="tablist" aria-label="প্লট ক্যাটাগরি" className="mx-auto flex w-max gap-2">
          {sections.map(({ group: g, plots: list }) => {
            const selected = g.id === group.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(g.id)}
                className={cn(
                  "rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                  selected
                    ? "border-garden-500 bg-garden-500 text-white"
                    : "border-limestone-300 bg-white text-ink hover:border-garden-500 hover:text-garden-700"
                )}
              >
                {g.name}
                <span className={cn("ml-2 text-xs font-medium", selected ? "text-white/80" : "text-ink-soft")}>
                  {bn(free(list))} খালি
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <PlotLegend />
        <p className="text-sm text-ink-soft">
          মোট {bn(plots.length)} · খালি {bn(free(plots))} · বিক্রিত {bn(plots.filter((p) => p.status === "sold").length)}
        </p>
      </div>
      {group.description && <p className="mt-3 text-sm text-ink-soft">{group.description}</p>}

      <div className="mt-5">
        <PlotLayout
          key={group.id}
          projectId={projectId}
          projectName={projectName}
          categoryName={group.name}
          rows={group.rows}
          columns={group.columns}
          plots={plots}
          className="max-h-[36rem] overflow-y-auto"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink-soft">যেকোনো প্লটে ক্লিক করে বিস্তারিত দেখুন — খালি প্লট সরাসরি বুক করতে পারবেন।</p>
        {group.slug && (
          <Link
            href={`/projects/${projectSlug}/plots/${group.slug}`}
            className="inline-flex items-center gap-2 font-semibold text-garden-600 hover:text-garden-700"
          >
            {group.name} — পূর্ণ পৃষ্ঠায় দেখুন <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
