import type { ReactNode } from "react";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { ImageCarousel } from "@/components/project/ImageCarousel";
import { HeroSlideshow } from "@/components/project/HeroSlideshow";
import { FloorPlanTabs } from "@/components/project/FloorPlanTabs";
import { RelatedProjects } from "@/components/project/RelatedProjects";
import { DownloadIcon, IconTileGrid } from "@/components/project/shared";
import type { ProjectSectionItemsBySection } from "@/lib/data/projectSectionItems";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Flat / Apartment project detail page (English). Holds exactly the
// sections of the apartment reference design, in its order:
//  Hero (photo slider, PROJECT DETAILS pill, name, address, status,
//  Floors · Units · Parking · Handover) → Overview & Specification →
//  Features & Amenities → Key Plan → Project Gallery → Featured
//  projects. A section without content is skipped.

const statusLabel: Record<ProjectStatus, string> = {
  ongoing: "Ongoing Project",
  completed: "Completed Project",
  upcoming: "Upcoming Project",
};

// Centered section heading in the reference style: optional pill, bold
// two-tone title, short accent bar and a one-line subtitle.
function Heading({
  pill,
  eyebrow,
  title,
  accent,
  lead,
  tone = "light",
}: {
  pill?: string;
  eyebrow?: string;
  title: string;
  accent?: string;
  lead?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="mx-auto max-w-2xl text-center">
      {pill && (
        <span
          className={cn(
            "inline-flex rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em]",
            dark ? "border-white/15 bg-white/10 text-garden-300" : "border-garden-100 bg-garden-50 text-garden-600"
          )}
        >
          {pill}
        </span>
      )}
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.3em] text-garden-600">{eyebrow}</p>}
      <h2
        className={cn(
          "mt-4 font-body text-3xl font-bold tracking-tight md:text-5xl",
          dark ? "text-white" : "text-ink"
        )}
      >
        {title} {accent && <span className={dark ? "text-garden-300" : "text-garden-500"}>{accent}</span>}
      </h2>
      <span
        aria-hidden
        className="mx-auto mt-4 block h-1 w-14 rounded-full bg-gradient-to-r from-transparent via-garden-500 to-transparent"
      />
      {lead && <p className={cn("mt-4 text-base", dark ? "text-white/70" : "text-ink-soft")}>{lead}</p>}
    </div>
  );
}

function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-20 md:py-28", className)}>
      <div className="container-content">{children}</div>
    </section>
  );
}

export function ApartmentProjectView({
  project,
  sections,
  related,
}: {
  project: Project;
  sections: ProjectSectionItemsBySection;
  related: Project[];
}) {
  const photos = [project.coverImage, ...project.gallery].filter((img) => img.url);

  const heroStats = [
    { value: project.floors, label: "Floors" },
    { value: project.totalUnits !== null ? String(project.totalUnits) : null, label: "Units" },
    { value: project.parkingSpaces, label: "Parking" },
    { value: project.handoverDate, label: "Handover" },
  ].filter((s): s is { value: string; label: string } => Boolean(s.value));

  // The reference sheet's twelve tiles, in its order.
  const specs = [
    { icon: "sun", label: "Orientation", value: project.facing },
    { icon: "road", label: "Front Road", value: project.frontRoadWidth },
    { icon: "ruler", label: "Land Size", value: project.totalArea },
    { icon: "grid", label: "Apartment Size", value: project.sizesOffered },
    { icon: "building", label: "Apartments", value: project.totalUnits !== null ? String(project.totalUnits) : null },
    { icon: "parking", label: "Parking", value: project.parkingSpaces },
    { icon: "layers", label: "Floors", value: project.floors },
    { icon: "calendar", label: "Handover", value: project.handoverDate },
    { icon: "lift", label: "Lifts", value: project.lifts },
    { icon: "stairs", label: "Stairs", value: project.stairs },
    { icon: "home", label: "Building Type", value: project.projectType },
    { icon: "pin", label: "Address", value: project.location },
  ].filter((s): s is { icon: string; label: string; value: string } => Boolean(s.value));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[540px] items-end overflow-hidden bg-garden-900 md:min-h-[600px]">
        <HeroSlideshow images={photos} />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        <div className="container-content w-full pb-12 pt-16 md:pb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-garden-300" />
            Project Details
          </span>

          <h1 className="mt-5 max-w-4xl font-body text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white md:text-7xl">
            {project.name}
          </h1>

          <p className="mt-6 flex max-w-2xl items-center gap-4 text-base text-white/85 md:text-lg">
            <span aria-hidden className="h-0.5 w-10 flex-shrink-0 rounded bg-garden-300" />
            {project.location}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            {project.tagline && <p className="text-base text-white/75 md:text-lg">{project.tagline}</p>}
            <span className="rounded-md bg-brass px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-card">
              {statusLabel[project.status]}
            </span>
          </div>

          {heroStats.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-y-6 border-t border-white/15 pt-8 sm:flex sm:flex-wrap">
              {heroStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn("flex flex-col-reverse sm:px-8", i === 0 && "sm:pl-0", i > 0 && "sm:border-l sm:border-white/15")}
                >
                  <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{stat.label}</dt>
                  <dd className="font-body text-3xl font-extrabold text-white md:text-4xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ── Overview & Specification ─────────────────────────── */}
      <Section id="overview" className="bg-gradient-to-b from-white to-limestone-100">
        <Heading title="Overview &" accent="Specification" />

        <div className="mt-14 grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <ImageCarousel images={photos} aspect="aspect-[1/1.08]" thumbnails />

          <div className="rounded-3xl border border-limestone-300/70 bg-white p-6 shadow-card sm:p-8">
            <div className="border-b border-limestone-300 pb-5">
              <div className="border-l-4 border-garden-500 pl-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-garden-600">Technical</p>
                <h3 className="font-body text-2xl font-bold tracking-tight">Specification</h3>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-start gap-3 rounded-xl border border-limestone-300/60 bg-limestone-100/70 p-4 transition-colors duration-200 hover:border-garden-300 hover:bg-garden-50/60"
                >
                  <ContentIcon icon={spec.icon} className="mt-0.5 h-5 w-5 flex-shrink-0 text-garden-500" />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">{spec.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">{spec.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {project.brochureUrl && (
              <a
                href={project.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-garden-500 px-5 py-3.5 text-sm font-bold text-white shadow-card transition-all hover:bg-garden-600 hover:shadow-card-hover"
              >
                <DownloadIcon />
                Download Brochure
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* ── Features & Amenities ─────────────────────────────── */}
      {sections.amenity.length > 0 && (
        <Section className="bg-white">
          <Heading
            pill="What we offer"
            title="Features &"
            accent="Amenities"
            lead="Experience world-class facilities designed for modern living."
          />
          <div className="mt-14">
            <IconTileGrid items={sections.amenity} />
          </div>
        </Section>
      )}

      {/* ── Key Plan ─────────────────────────────────────────── */}
      {sections.floor_plan.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1424] via-garden-900 to-[#0b1424] py-20 md:py-28">
          <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-garden-500/20 blur-3xl" />
          <div className="container-content relative">
            <Heading pill="Floor plans" title="Key" accent="Plan" tone="dark" />
            <div className="mt-10">
              <FloorPlanTabs plans={sections.floor_plan} />
            </div>
          </div>
        </section>
      )}

      {/* ── Project Gallery ──────────────────────────────────── */}
      {project.gallery.length > 0 && (
        <Section className="bg-white">
          <Heading eyebrow="Gallery" title="Project Gallery" lead="A curated visual collection of the project." />
          <div className="mt-12">
            <ImageGallery images={project.gallery} square showCategories={false} />
          </div>
        </Section>
      )}

      {/* ── Featured projects ────────────────────────────────── */}
      {related.length > 0 && (
        <section className="overflow-hidden bg-white py-20 md:py-28">
          <div className="container-content">
            <RelatedProjects
              projects={related}
              eyebrow="Featured projects"
              title={
                <>
                  Bespoke homes with finesse <span className="text-garden-500">in architecture and design</span>
                </>
              }
            />
          </div>
        </section>
      )}

    </>
  );
}
