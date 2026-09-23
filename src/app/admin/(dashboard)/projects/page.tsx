import { ProjectTable } from "@/components/admin/ProjectTable";
import { Button } from "@/components/ui/Button";
import { getAllProjectsAdmin } from "@/lib/admin/projects";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">Projects</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Add, edit, publish, and remove projects. Status changes move a
            project between the public Ongoing / Completed / Upcoming pages
            automatically.
          </p>
        </div>
        <Button href="/admin/projects/new">Add Project</Button>
      </div>

      <div className="mt-8">
        <ProjectTable projects={projects} />
      </div>
    </div>
  );
}
