"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { Project } from "@/lib/types";
import { ProjectStatusBadge } from "@/components/ui/ProjectStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteProject, togglePublished } from "@/app/admin/(dashboard)/projects/actions";

export function ProjectTable({ projects }: { projects: Project[] }) {
  const [isPending, startTransition] = useTransition();

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description='Click "Add Project" to create the first one.'
        action={<Button href="/admin/projects/new">Add Project</Button>}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3.5 font-semibold">Project</th>
            <th className="px-4 py-3.5 font-semibold">Status</th>
            <th className="px-4 py-3.5 font-semibold">Location</th>
            <th className="px-4 py-3.5 font-semibold">Published</th>
            <th className="px-4 py-3.5 font-semibold">Updated</th>
            <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className="border-b border-limestone-300 transition-colors duration-150 last:border-0 hover:bg-limestone-100/70"
            >
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-md border border-limestone-300">
                    <Image
                      src={project.coverImage.url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium text-ink">{project.name}</span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <ProjectStatusBadge status={project.status} />
              </td>
              <td className="px-4 py-3.5 text-ink-soft">{project.location}</td>
              <td className="px-4 py-3.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => togglePublished(project.id, !project.published))
                  }
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
                </button>
              </td>
              <td className="px-4 py-3.5 text-ink-soft">
                {new Date(project.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end gap-2">
                  <Button href={`/admin/projects/${project.id}/edit`} variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(`Delete "${project.name}"? This can't be undone.`)) {
                        startTransition(() => deleteProject(project.id));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
