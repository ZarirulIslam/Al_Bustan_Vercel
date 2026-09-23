import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<ProjectStatus, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  upcoming: "Upcoming",
};

const styles: Record<ProjectStatus, string> = {
  ongoing: "bg-garden-500 text-white",
  completed: "bg-sky text-white",
  upcoming: "bg-brass text-white",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold tracking-wide shadow-sm",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
