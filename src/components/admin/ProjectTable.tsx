"use client";

import Image from "next/image";
import type { Project, ProjectCategory } from "@/lib/types";
import { projectAdminBase, projectEditPath } from "@/lib/projectSections";
import { ProjectStatusBadge } from "@/components/ui/ProjectStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteProject, togglePublished } from "@/app/admin/(dashboard)/projects/actions";
import { useAdminAction } from "@/components/admin/AdminToaster";

export function ProjectTable({ projects, category }: { projects: Project[]; category: ProjectCategory }) {
  const isFlat = category === "flat";
  const { run, isPending } = useAdminAction();

  if (projects.length === 0) {
    return (
      <EmptyState
        title={isFlat ? "No apartment projects yet" : "No land projects yet"}
        description={isFlat ? "Create the first building — its page uses the English apartment layout." : "Create the first land project — its page uses the Bangla township layout."}
        action={<Button href={`${projectAdminBase(category)}/new`}>{isFlat ? "Add apartment project" : "Add land project"}</Button>}
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
            <th className="px-4 py-3.5 font-semibold">{isFlat ? "Apartments" : "Plots"}</th>
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
                  <a href={projectEditPath(project)} className="font-medium text-ink hover:text-garden-700">
                    {project.name}
                  </a>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <ProjectStatusBadge status={project.status} />
              </td>
              <td className="px-4 py-3.5 text-ink-soft">{project.location}</td>
              <td className="px-4 py-3.5 text-ink-soft">
                {project.totalUnits !== null
                  ? `${project.availableUnits ?? "—"} / ${project.totalUnits} available`
                  : "—"}
              </td>
              <td className="px-4 py-3.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    run(() => togglePublished(project.id, !project.published), project.published ? "Project unpublished." : "Project published.")
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
                  <Button href={projectEditPath(project)} variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(`Delete "${project.name}"? This can't be undone.`)) {
                        run(() => deleteProject(project.id), "Project deleted.");
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
