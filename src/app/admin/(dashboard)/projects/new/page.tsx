import { ProjectForm } from "@/components/admin/ProjectForm";
import { createProject } from "@/app/admin/(dashboard)/projects/actions";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-3xl">Add Project</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Fill in the project details below. Use clearly labeled placeholders
        for anything not yet confirmed.
      </p>

      <div className="mt-8 max-w-3xl">
        <ProjectForm action={createProject} submitLabel="Create Project" />
      </div>
    </div>
  );
}
