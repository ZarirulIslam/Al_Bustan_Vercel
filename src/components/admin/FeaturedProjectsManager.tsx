"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { Project } from "@/lib/types";
import { ProjectStatusBadge } from "@/components/ui/ProjectStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { toggleFeaturedProject } from "@/app/admin/(dashboard)/homepage/actions";

// Kept separate from the Projects table on purpose — Featured is a
// homepage-curation decision, distinct from a project's own
// Published state (a project can be featured while still
// unpublished; it just won't show on the homepage until published).
export function FeaturedProjectsManager({ projects }: { projects: Project[] }) {
  const [isPending, startTransition] = useTransition();

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Add a project first, then come back here to feature it on the homepage."
      />
    );
  }

  const featuredCount = projects.filter((p) => p.featured).length;

  return (
    <div>
      <p className="text-sm text-ink-soft">
        {featuredCount === 0
          ? "Nothing featured yet — the homepage currently falls back to showing the most recently updated ongoing, completed and upcoming project."
          : `${featuredCount} project${featuredCount === 1 ? "" : "s"} featured. Only published projects among these will actually show on the homepage.`}
      </p>

      <div className="mt-4 divide-y divide-limestone-300 overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-4 px-4 py-3.5">
            <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-md border border-limestone-300">
              <Image src={project.coverImage.url} alt="" fill sizes="64px" className="object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{project.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <span
                  className={
                    project.published
                      ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                      : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                  }
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${project.published ? "bg-garden-500" : "bg-ink-soft/50"}`}
                  />
                  {project.published ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() => toggleFeaturedProject(project.id, !project.featured))
              }
              className={
                project.featured
                  ? "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-brass-50 px-3 py-1.5 text-xs font-medium text-brass-dark"
                  : "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-limestone-300 px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brass-dark hover:text-brass-dark"
              }
            >
              <span className={`h-1.5 w-1.5 rounded-full ${project.featured ? "bg-brass-dark" : "bg-ink-soft/50"}`} />
              {project.featured ? "Featured" : "Feature on homepage"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
