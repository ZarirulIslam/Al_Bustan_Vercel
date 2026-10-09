import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProjectTable } from "@/components/admin/ProjectTable";
import { Button } from "@/components/ui/Button";
import { ProjectStatusBadge } from "@/components/ui/ProjectStatusBadge";
import { LandProjectEditor } from "@/components/admin/project-editor/LandProjectEditor";
import { ApartmentProjectEditor } from "@/components/admin/project-editor/ApartmentProjectEditor";
import { createProject, updateProject } from "@/app/admin/(dashboard)/projects/actions";
import { getProjectByIdAdmin, getProjectsByCategoryAdmin } from "@/lib/admin/projects";
import { getSectionItemsForProjectAdmin } from "@/lib/data/projectSectionItems";
import { projectAdminBase, projectEditPath } from "@/lib/projectSections";
import type { ProjectCategory } from "@/lib/types";

// Server pages shared by the two project areas of the CMS —
// /admin/projects/land (Bangla township pages) and
// /admin/projects/apartments (English building pages). Each area has its
// own list and its own editor, because the two page types hold
// different content.

const AREA = {
  land_plot: {
    title: "Land Projects",
    singular: "land project",
    blurb: "Township projects with plots. Their public pages are in Bangla and follow the land layout.",
  },
  flat: {
    title: "Apartment Projects",
    singular: "apartment project",
    blurb: "Buildings with apartments. Their public pages are in English and follow the apartment layout.",
  },
} as const;

export async function ProjectListPage({ category }: { category: ProjectCategory }) {
  const projects = await getProjectsByCategoryAdmin(category);
  const area = AREA[category];

  return (
    <div>
      <nav className="text-xs text-ink-soft">
        <Link href="/admin/projects" className="hover:text-garden-700">
          Projects
        </Link>{" "}
        / {area.title}
      </nav>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">{area.title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
            {area.blurb} Status moves a project between the public Ongoing / Completed / Upcoming pages.
          </p>
        </div>
        <Button href={`${projectAdminBase(category)}/new`}>Add {area.singular}</Button>
      </div>
      <div className="mt-8">
        <ProjectTable projects={projects} category={category} />
      </div>
    </div>
  );
}

export function NewProjectPage({ category }: { category: ProjectCategory }) {
  const area = AREA[category];
  return (
    <div>
      <nav className="text-xs text-ink-soft">
        <Link href={projectAdminBase(category)} className="hover:text-garden-700">
          {area.title}
        </Link>{" "}
        / New
      </nav>
      <h1 className="mt-2 text-3xl">Add {area.singular}</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
        Fill in the sections in order — each matches a part of the public page. After the first save you can add the
        lists (amenities, plans, FAQ…).
      </p>
      <div className="mt-8">
        {category === "flat" ? (
          <ApartmentProjectEditor action={createProject} />
        ) : (
          <LandProjectEditor action={createProject} />
        )}
      </div>
    </div>
  );
}

export async function EditProjectPage({ id, category }: { id: string; category: ProjectCategory }) {
  const project = await getProjectByIdAdmin(id);
  if (!project) notFound();
  // Opened from the other area's URL: send it to the right editor.
  if (project.category !== category) redirect(projectEditPath(project));

  const sections = await getSectionItemsForProjectAdmin(project.id);
  const area = AREA[category];
  const boundUpdate = updateProject.bind(null, project.id);

  return (
    <div>
      <nav className="text-xs text-ink-soft">
        <Link href={projectAdminBase(category)} className="hover:text-garden-700">
          {area.title}
        </Link>{" "}
        / Edit
      </nav>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl">{project.name}</h1>
          <ProjectStatusBadge status={project.status} />
          <span
            className={
              project.published
                ? "rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                : "rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
            }
          >
            {project.published ? "Published" : "Draft"}
          </span>
        </div>
        {project.published && (
          <Link
            href={`/projects/${project.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-garden-300 px-3.5 py-1.5 text-xs font-medium text-garden-700 transition-colors hover:bg-garden-50"
          >
            View live page ↗
          </Link>
        )}
      </div>
      <div className="mt-8">
        {category === "flat" ? (
          <ApartmentProjectEditor action={boundUpdate} project={project} sections={sections} />
        ) : (
          <LandProjectEditor action={boundUpdate} project={project} sections={sections} />
        )}
      </div>
    </div>
  );
}
