import Image from "next/image";
import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusLabel: Record<ProjectStatus, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  upcoming: "Upcoming",
};

const statusDot: Record<ProjectStatus, string> = {
  ongoing: "bg-garden-300",
  completed: "bg-sky-light",
  upcoming: "bg-brass-light",
};

// Tall full-photo project card, used for every project listing. It
// carries exactly: status, position number, photo count, address, name,
// and one "Project detail" figure (handover date, else size, else area).
export function ProjectCard({ project, index }: { project: Project; index?: number }) {
  const photoCount = [project.coverImage, ...project.gallery].filter((img) => img.url).length;
  const detail = project.handoverDate || project.sizesOffered || project.totalArea;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative isolate flex aspect-[4/5.4] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-garden-900 p-5 text-white shadow-card transition-all duration-500 ease-estate hover:-translate-y-1.5 hover:shadow-card-hover sm:p-6"
    >
      {project.coverImage.url && (
        <Image
          src={project.coverImage.url}
          alt={project.coverImage.alt || project.name}
          fill
          sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
          className="-z-20 object-cover transition-transform duration-700 ease-estate group-hover:scale-[1.06]"
        />
      )}
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-garden-900" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-garden-900 via-garden-900/80 to-transparent" />

      {/* Top row: status · number / photos */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur-md">
          <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[project.status])} />
          {statusLabel[project.status]}
        </span>
        <div className="flex flex-col items-end gap-2">
          {index !== undefined && (
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/25 text-[11px] font-bold tabular-nums backdrop-blur-md">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {photoCount > 0 && (
            <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-md">
              {photoCount} {photoCount === 1 ? "Photo" : "Photos"}
            </span>
          )}
        </div>
      </div>

      {/* Bottom: address · name · project detail */}
      <div>
        <p className="flex items-start gap-1.5 text-xs font-medium text-white/85">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-px flex-shrink-0 text-garden-300">
            <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" fill="currentColor" />
            <circle cx="12" cy="9" r="2.6" fill="#081F14" />
          </svg>
          <span className="line-clamp-1">{project.location}</span>
        </p>
        <h3 className="mt-2 font-body text-2xl font-bold uppercase leading-tight tracking-tight text-white">{project.name}</h3>
        <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/20 pt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-garden-300">Project detail</p>
            {detail && <p className="mt-1.5 truncate text-xs font-bold uppercase tracking-[0.08em] text-white/90">{detail}</p>}
          </div>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-all duration-300 group-hover:border-garden-300 group-hover:bg-garden-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
