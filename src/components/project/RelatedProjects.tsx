"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusPill: Record<ProjectStatus, { label: string; className: string }> = {
  ongoing: { label: "Ongoing", className: "bg-brass text-white" },
  upcoming: { label: "Upcoming", className: "bg-sky text-white" },
  completed: { label: "Completed", className: "bg-garden-500 text-white" },
};

// "Featured projects" strip at the end of an apartment page: heading on
// the left, arrows on the right, then tall scroll-snapping cards.
export function RelatedProjects({
  projects,
  eyebrow,
  title,
}: {
  projects: Project[];
  eyebrow: string;
  title: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-garden-600">
            <span aria-hidden className="h-px w-8 bg-current" />
            {eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl font-body text-3xl font-bold leading-tight tracking-tight md:text-5xl">{title}</h2>
        </div>
        {projects.length > 1 && (
          <div className="flex gap-3">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => scroll(dir)}
                aria-label={dir === -1 ? "Previous projects" : "More projects"}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-limestone-300 bg-white text-ink transition-colors hover:border-garden-500 hover:bg-garden-500 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d={dir === -1 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={track}
        className="-mx-6 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 md:-mx-10 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project) => {
          const pill = statusPill[project.status];
          return (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group relative aspect-[4/5] w-[78%] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-garden-900 shadow-card sm:w-[46%] lg:w-[calc((100%-3.75rem)/3.5)]"
            >
              <Image
                src={project.coverImage.url}
                alt={project.coverImage.alt}
                fill
                sizes="(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 78vw"
                className="object-cover transition-transform duration-700 ease-estate group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
              <span
                className={cn(
                  "absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] shadow-sm",
                  pill.className
                )}
              >
                {pill.label}
              </span>
              <span className="absolute inset-x-5 bottom-5">
                <span className="block font-body text-xl font-bold text-white drop-shadow md:text-2xl">{project.name}</span>
                <span className="mt-1 block max-h-0 overflow-hidden text-sm text-white/80 opacity-0 transition-all duration-300 group-hover:max-h-10 group-hover:opacity-100">
                  {project.location} →
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
