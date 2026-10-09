import type { Metadata } from "next";
import Link from "next/link";
import { ProjectGrid } from "@/components/ui/ProjectGrid";
import { ProjectsHeroSlider } from "@/components/project/ProjectsHeroSlider";
import { getAllPublishedProjects } from "@/lib/data/projects";
import { getSiteSettings } from "@/lib/data/settings";
import { cn } from "@/lib/utils";
import type { ProjectStatus, ProjectCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
};

export const revalidate = 0;

const typeTabs: { label: string; value: ProjectCategory | "all" }[] = [
  { label: "All Projects", value: "all" },
  { label: "Land Project", value: "land_plot" },
  { label: "Apartment Project", value: "flat" },
];

const statusTabs: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "Any status", value: "all" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
];

// Projects index: hero slider of published projects → "Signature
// developments" grid (filter by type and status) → closing band.
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status, category } = await searchParams;
  const [all, settings] = await Promise.all([getAllPublishedProjects(), getSiteSettings()]);

  const activeStatus = (["ongoing", "completed", "upcoming"].includes(status ?? "") ? status : "all") as
    | ProjectStatus
    | "all";
  const activeCategory = (["land_plot", "flat"].includes(category ?? "") ? category : "all") as ProjectCategory | "all";

  const projects = all.filter(
    (p) => (activeStatus === "all" || p.status === activeStatus) && (activeCategory === "all" || p.category === activeCategory)
  );

  function href(nextStatus: typeof activeStatus, nextCategory: typeof activeCategory) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextCategory !== "all") params.set("category", nextCategory);
    const qs = params.toString();
    return `${qs ? `/projects?${qs}` : "/projects"}#projects`;
  }

  return (
    <>
      <ProjectsHeroSlider projects={all} companyName={settings.companyName} />

      <section id="projects" className="relative scroll-mt-24 overflow-hidden py-20 md:py-28">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-garden-50/70 via-limestone-100 to-limestone" />
        <div aria-hidden className="absolute -left-40 top-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-garden-100/60 blur-3xl" />
        <div className="container-content">
          <p className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.28em] text-garden-600">
            <span aria-hidden className="h-px w-12 bg-current" />
            Signature developments
          </p>
          <h2 className="mt-5 max-w-2xl font-body text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl">
            Designed for a better way of living.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
            Explore our land and apartment developments — every project, its location and progress, in one place.
          </p>

          {/* Filters */}
          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-limestone-300/70 bg-white/80 p-3 shadow-card backdrop-blur lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Project type" className="flex flex-wrap gap-1.5">
              {typeTabs.map((tab) => (
                <Link
                  key={tab.value}
                  href={href(activeStatus, tab.value)}
                  scroll={false}
                  aria-current={tab.value === activeCategory ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                    tab.value === activeCategory ? "bg-garden-700 text-white shadow-sm" : "text-ink-soft hover:bg-limestone-100 hover:text-garden-700"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <nav aria-label="Project status" className="flex flex-wrap gap-1.5">
                {statusTabs.map((tab) => (
                  <Link
                    key={tab.value}
                    href={href(tab.value, activeCategory)}
                    scroll={false}
                    aria-current={tab.value === activeStatus ? "page" : undefined}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-200",
                      tab.value === activeStatus
                        ? "border-garden-500 bg-garden-50 text-garden-700"
                        : "border-limestone-300 text-ink-soft hover:border-garden-300 hover:text-garden-700"
                    )}
                  >
                    {tab.label}
                  </Link>
                ))}
              </nav>
              <span className="rounded-full bg-garden-900 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
                {projects.length} {projects.length === 1 ? "Project" : "Projects"}
              </span>
            </div>
          </div>

          <div className="mt-10">
            <ProjectGrid
              projects={projects}
              emptyTitle="No projects match these filters"
              emptyDescription="Try another project type or status."
            />
          </div>
        </div>
      </section>

      {/* Closing band */}
      <section className="bg-garden-900 py-14">
        <div className="container-content flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-garden-300">{settings.companyName}</p>
            <p className="mt-3 font-body text-2xl font-bold text-white md:text-3xl">Discover the project that fits your vision.</p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white hover:text-garden-900"
          >
            Back to top ↑
          </a>
        </div>
      </section>
    </>
  );
}
