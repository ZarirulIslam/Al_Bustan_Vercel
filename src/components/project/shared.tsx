import type { ReactNode } from "react";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { cn } from "@/lib/utils";
import type { Project, ProjectSectionItem } from "@/lib/types";
import { SHARED_COPY, type ProjectLocale } from "@/lib/projectCopy";

// Building blocks shared by the Land/Plot and Flat/Apartment project
// detail layouts (LandProjectView / ApartmentProjectView).

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  tone?: "dark" | "light";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em]",
            tone === "light" ? "text-brass-light" : "text-brass-dark"
          )}
        >
          {centered && <span aria-hidden className="h-px w-8 bg-current opacity-50" />}
          {eyebrow}
          <span aria-hidden className="h-px w-8 bg-current opacity-50" />
        </p>
      )}
      <h2 className={cn("mt-3 text-3xl md:text-4xl", tone === "light" && "text-white")}>{title}</h2>
      {lead && (
        <p className={cn("mt-4 text-base md:text-lg", tone === "light" ? "text-white/75" : "text-ink-soft")}>{lead}</p>
      )}
    </div>
  );
}

// Rounded icon chip — the one visual motif every icon card, list and
// spec tile on the project pages shares.
export function IconChip({ icon, size = "md", className }: { icon: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-xl bg-garden-50 text-garden-600 ring-1 ring-garden-100",
        size === "md" ? "h-12 w-12" : "h-10 w-10",
        className
      )}
    >
      <ContentIcon icon={icon} className={size === "md" ? "h-6 w-6" : "h-5 w-5"} />
    </span>
  );
}

// Centered icon tile grid — amenities and security.
export function IconTileGrid({
  items,
  columns = 4,
  showDescription = true,
}: {
  items: ProjectSectionItem[];
  columns?: 3 | 4;
  showDescription?: boolean;
}) {
  return (
    // Flex-wrap rather than grid so an incomplete last row centers.
    <ul className="flex flex-wrap justify-center gap-4 sm:gap-5">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "group flex w-[calc(50%-0.5rem)] flex-col items-center rounded-2xl border border-limestone-300/70 bg-white px-4 py-7 text-center shadow-card transition-all duration-300 ease-estate hover:-translate-y-1 hover:border-garden-300 hover:shadow-card-hover sm:w-[calc(50%-0.625rem)] sm:py-9 md:w-[calc(33.333%-0.834rem)]",
            columns === 4 && "lg:w-[calc(25%-0.9375rem)]"
          )}
        >
          <IconChip
            icon={item.icon}
            className="transition-colors duration-300 group-hover:bg-garden-500 group-hover:text-white group-hover:ring-garden-500"
          />
          <p className="mt-4 text-sm font-medium text-ink sm:text-base">{item.title}</p>
          {showDescription && item.description && <p className="mt-1.5 text-xs text-ink-soft sm:text-sm">{item.description}</p>}
        </li>
      ))}
    </ul>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true" className={className}>
      <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 1V9M7 9L4 6M7 9L10 6M1 11V12.5C1 12.7761 1.22386 13 1.5 13H12.5C12.7761 13 13 12.7761 13 12.5V11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function directionsUrl(project: Pick<Project, "latitude" | "longitude" | "location">) {
  const destination =
    project.latitude !== null && project.longitude !== null
      ? `${project.latitude},${project.longitude}`
      : project.location;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

const pillBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ease-estate";

export const pill = {
  solid: cn(pillBase, "bg-garden-500 text-white shadow-card hover:bg-garden-600 hover:shadow-card-hover"),
  outline: cn(pillBase, "border border-garden-500 text-garden-600 hover:bg-garden-50"),
  gold: cn(pillBase, "bg-brass text-white shadow-card hover:bg-brass-dark"),
  ghostLight: cn(pillBase, "border border-white/40 text-white hover:border-white hover:bg-white/10"),
};

export function Disclaimer({ locale = "en" }: { locale?: ProjectLocale }) {
  return (
    <section className="border-t border-limestone-300 bg-limestone-200/60 py-10">
      <div className="container-content">
        <p className="max-w-3xl text-xs text-ink-soft">{SHARED_COPY[locale].disclaimer}</p>
      </div>
    </section>
  );
}
