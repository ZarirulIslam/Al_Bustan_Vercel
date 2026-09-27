"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FaqAccordionItem {
  question: string;
  // Already-rendered answer — callers pass <RichText>, which sanitizes
  // on the server (this component runs in the browser).
  answer: ReactNode;
}

// Morphs a "+" into a "−" by rotating the vertical stroke away —
// the same glyph the reference FAQ uses to show a card is collapsed
// (+) vs. expanded and hideable again (−).
function PlusMinusIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center" aria-hidden="true">
      <span className="absolute h-px w-3.5 bg-current" />
      <span
        className={cn(
          "absolute h-3.5 w-px bg-current transition-transform duration-200 ease-estate",
          open && "rotate-90 scale-y-0"
        )}
      />
    </span>
  );
}

// Dark-panel accordion — each card can be independently hidden
// (collapsed) or unhidden (expanded) via the +/− control, matching
// the reference FAQ. Cards flow through a CSS multi-column layout so
// they settle into a natural, slightly uneven two-column arrangement
// instead of a rigid grid.
export function FaqAccordion({
  items,
  defaultOpenIndex = 0,
}: {
  items: FaqAccordionItem[];
  defaultOpenIndex?: number | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  if (items.length === 0) return null;

  return (
    <div className="columns-1 gap-4 md:columns-2">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `faq-panel-${index}`;
        return (
          <div
            key={item.question}
            className="mb-4 break-inside-avoid rounded-xl border border-white/10 bg-white/5 transition-colors duration-200 ease-estate hover:border-white/20"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white sm:text-base"
            >
              {item.question}
              <span
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brass/20 text-brass-light transition-colors duration-200 ease-estate",
                  open && "bg-brass text-white"
                )}
              >
                <PlusMinusIcon open={open} />
              </span>
            </button>
            <div
              id={panelId}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-estate",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-sm text-limestone-200/75">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
