"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProjectSectionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

// Key plan switcher for apartment projects — one tab per floor type.
export function FloorPlanTabs({ plans }: { plans: ProjectSectionItem[] }) {
  const [active, setActive] = useState(0);
  const plan = plans[active];
  if (!plan) return null;

  return (
    <div>
      <div role="tablist" aria-label="Floor plans" className="flex flex-wrap justify-center gap-2.5">
        {plans.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200",
              i === active
                ? "border-garden-300 bg-garden-500 text-white shadow-card"
                : "border-white/15 bg-white/[0.07] text-white/90 hover:border-white/40 hover:bg-white/[0.12]"
            )}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mx-auto mt-10 max-w-4xl">
        {plan.imageUrl && (
          <a
            href={plan.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-white p-4 shadow-card-hover sm:p-8"
            aria-label={`Open ${plan.title} plan in full size`}
          >
            <span className="relative block h-full w-full">
              <Image
                key={plan.id}
                src={plan.imageUrl}
                alt={`${plan.title} floor plan`}
                fill
                sizes="(min-width: 1024px) 56rem, 100vw"
                className="object-contain"
              />
            </span>
            <span className="absolute bottom-4 right-4 rounded-full bg-garden-900/80 px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Open full size ↗
            </span>
          </a>
        )}
        {plan.description && <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-white/75">{plan.description}</p>}
      </div>
    </div>
  );
}
