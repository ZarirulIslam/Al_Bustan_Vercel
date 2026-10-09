"use client";

import { useState } from "react";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { PLOT_TABS } from "@/lib/projectSections";
import type { ProjectSectionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

// "উপলব্ধ প্লটসমূহ": আবাসিক / বাণিজ্যিক tabs over the plot-type cards.
// Only tabs that have plots are shown; untagged plots count as আবাসিক.
export function PlotTypeTabs({ items }: { items: ProjectSectionItem[] }) {
  const tabOf = (item: ProjectSectionItem) => item.tab ?? PLOT_TABS[0].value;
  const tabs = PLOT_TABS.filter((t) => items.some((item) => tabOf(item) === t.value));
  const [active, setActive] = useState(tabs[0]?.value);
  const visible = items.filter((item) => tabOf(item) === active);

  return (
    <div>
      {tabs.length > 1 && (
        <div role="tablist" aria-label="প্লটের ধরন" className="flex flex-wrap justify-center gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={tab.value === active}
              onClick={() => setActive(tab.value)}
              className={cn(
                "rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-200",
                tab.value === active
                  ? "border-garden-500 bg-garden-500 text-white shadow-card"
                  : "border-limestone-300 bg-white text-ink-soft hover:border-garden-300 hover:text-garden-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <ul role="tabpanel" className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2", tabs.length > 1 && "mt-10")}>
        {visible.map((item) => (
          <li
            key={item.id}
            className="group rounded-3xl border border-limestone-300/70 bg-white p-7 text-center shadow-card transition-all duration-300 ease-estate hover:-translate-y-1 hover:border-garden-300 hover:shadow-card-hover"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-garden-50 text-garden-600 ring-1 ring-garden-100 transition-colors duration-300 group-hover:bg-garden-500 group-hover:text-white">
              <ContentIcon icon={item.icon} className="h-7 w-7" />
            </span>
            <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
            {item.description && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
