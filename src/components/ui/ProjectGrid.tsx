import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function ProjectGrid({
  projects,
  emptyTitle = "No projects to show yet",
  emptyDescription = "Projects will appear here once they're added and published from the admin dashboard.",
}: {
  projects: Project[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (projects.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
