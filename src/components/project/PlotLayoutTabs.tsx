"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlotBrowser } from "@/components/project/PlotBrowser";
import type { PlotGroup, PublicPlot } from "@/lib/types";
import { blockLabel, groupByBlock, groupFullName, plotTabHash } from "@/lib/plotLayout";
import { cn } from "@/lib/utils";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

type PlotSection = { group: PlotGroup; plots: PublicPlot[] };

const free = (list: PublicPlot[]) => list.filter((p) => p.status === "available").length;
const freeIn = (sections: PlotSection[]) => sections.reduce((n, s) => n + free(s.plots), 0);

// প্লট তালিকা section of the land project page. Blocks are the main
// category (Block A, Block B, …) and each block's sizes (৩ কাঠা, ৫ কাঠা,
// বাণিজ্যিক, …) the sub-category; the chosen size's layout shows right
// here (in a scroll box, so a 500-plot layout doesn't take over the
// page) with a link to its own full page. Without blocks, only the size
// tabs show.
export function PlotLayoutTabs({
  projectId,
  projectName,
  projectSlug,
  sections,
}: {
  projectId: string;
  projectName: string;
  projectSlug: string;
  sections: PlotSection[];
}) {
  const [activeId, setActiveId] = useState(sections[0].group.id);
  const active = sections.find((s) => s.group.id === activeId) ?? sections[0];
  const { group, plots } = active;

  const blocks = groupByBlock(sections, (s) => s.group);
  const hasBlocks = blocks.some((b) => b.block);
  const activeBlock = blocks.find((b) => b.items.includes(active)) ?? blocks[0];

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
      {/* Main category: blocks. */}
      {hasBlocks && (
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div role="tablist" aria-label="ব্লক" className="mx-auto flex w-max gap-2 sm:gap-3">
            {blocks.map((b) => {
              const selected = b === activeBlock;
              return (
                <button
                  key={b.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(b.items[0].group.id)}
                  className={cn(
                    "flex min-w-[6.5rem] flex-col items-center whitespace-nowrap rounded-2xl border-2 px-4 py-2.5 transition-colors sm:min-w-[8rem] sm:px-6 sm:py-3",
                    selected
                      ? "border-garden-700 bg-garden-700 text-white shadow-card"
                      : "border-limestone-300 bg-white text-ink hover:border-garden-500"
                  )}
                >
                  <span className="text-base font-bold sm:text-lg">{b.block ? blockLabel(b.block) : "অন্যান্য"}</span>
                  <span className={cn("text-xs font-medium", selected ? "text-white/80" : "text-ink-soft")}>
                    {bn(freeIn(b.items))} খালি প্লট
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-category: the sizes of the chosen block. Shown even for a
          single size, so visitors see what's on offer. */}
      <div className={cn("-mx-4 overflow-x-auto px-4", hasBlocks && "mt-5")}>
        {hasBlocks && (
          <p className="mb-2 text-center text-sm font-semibold text-ink">
            {activeBlock.block ? blockLabel(activeBlock.block) : "অন্যান্য"} — প্লটের সাইজ বেছে নিন
          </p>
        )}
        <div role="tablist" aria-label="প্লটের সাইজ" className="mx-auto flex w-max gap-2">
          {activeBlock.items.map(({ group: g, plots: list }) => {
            const selected = g.id === group.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(g.id)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors sm:px-5",
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

      {group.description && <p className="mt-6 text-center text-sm text-ink-soft">{group.description}</p>}

      <div className="mt-8">
        <PlotBrowser
          key={group.id}
          projectId={projectId}
          projectName={projectName}
          group={group}
          plots={plots}
          layoutClassName="max-h-[70dvh] overflow-y-auto sm:max-h-[36rem]"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-ink-soft">যেকোনো প্লটে ক্লিক করে বিস্তারিত দেখুন — খালি প্লট সরাসরি বুক করতে পারবেন।</p>
        {group.slug && (
          <Link
            href={`/projects/${projectSlug}/plots/${group.slug}`}
            className="inline-flex items-center gap-2 font-semibold text-garden-600 hover:text-garden-700"
          >
            {groupFullName(group)} — পূর্ণ পৃষ্ঠায় দেখুন <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
