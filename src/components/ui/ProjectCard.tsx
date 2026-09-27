import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { richTextPreview } from "@/lib/richText/shared";
import { ProjectStatusBadge } from "@/components/ui/ProjectStatusBadge";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block overflow-hidden rounded-lg border border-limestone-300 bg-white shadow-card transition-all duration-300 ease-estate hover:-translate-y-1 hover:border-garden-300 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={project.coverImage.url}
          alt={project.coverImage.alt}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 ease-estate group-hover:scale-[1.04]"
        />
        <div className="absolute left-4 top-4 flex gap-2">
          <ProjectStatusBadge status={project.status} />
          <span className="inline-flex items-center rounded bg-white/90 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur">
            {project.category === "flat" ? "Flat" : "Land / Plot"}
          </span>
        </div>
      </div>

      <div className="p-6">
        <p className="flex items-center gap-1.5 text-sm text-ink-soft">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0 text-garden-500">
            <path
              d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          {project.location}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="text-xl leading-snug">{project.name}</h3>
          {project.pricingInfo && (
            <span className="shrink-0 text-sm font-semibold text-garden-700">
              {richTextPreview(project.pricingInfo)}
            </span>
          )}
        </div>
        <p className="mt-2.5 text-sm text-ink-soft">
          {project.shortDescription}
        </p>

        {(project.sizesOffered || project.totalArea) && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-limestone-300 pt-4 text-sm text-ink-soft">
            {project.totalArea && <span>{project.totalArea}</span>}
            {project.sizesOffered && (
              <span className="flex items-center gap-1.5">
                {project.totalArea && <span className="text-limestone-300">•</span>}
                {project.sizesOffered}
              </span>
            )}
          </div>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-garden-600">
          View Details
          <svg
            width="14"
            height="10"
            viewBox="0 0 14 10"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-200 ease-estate group-hover:translate-x-1"
          >
            <path
              d="M1 5H13M13 5L9 1M13 5L9 9"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
}
