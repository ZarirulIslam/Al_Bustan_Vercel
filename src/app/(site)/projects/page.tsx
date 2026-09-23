import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ProjectGrid } from "@/components/ui/ProjectGrid";
import {
  getAllPublishedProjects,
  getProjectsByStatus,
} from "@/lib/data/projects";
import { cn } from "@/lib/utils";
import type { ProjectStatus, ProjectCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
};

export const revalidate = 0;

const statusTabs: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All Status", value: "all" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Upcoming", value: "upcoming" },
];

const categoryTabs: { label: string; value: ProjectCategory | "all" }[] = [
  { label: "All Types", value: "all" },
  { label: "Land / Plot", value: "land_plot" },
  { label: "Flat / Apartment", value: "flat" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status, category } = await searchParams;

  const activeStatus = (
    ["ongoing", "completed", "upcoming"].includes(status ?? "") ? status : "all"
  ) as ProjectStatus | "all";

  const activeCategory = (
    ["land_plot", "flat"].includes(category ?? "") ? category : "all"
  ) as ProjectCategory | "all";

  const byStatus =
    activeStatus === "all"
      ? await getAllPublishedProjects()
      : await getProjectsByStatus(activeStatus);

  const projects =
    activeCategory === "all" ? byStatus : byStatus.filter((p) => p.category === activeCategory);

  function tabHref(status: typeof activeStatus, category: typeof activeCategory) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (category !== "all") params.set("category", category);
    const qs = params.toString();
    return qs ? `/projects?${qs}` : "/projects";
  }

  return (
    <Section className="pt-16 md:pt-20">
      <Container>
        <p className="text-sm text-brass">Projects</p>
        <h1 className="mt-3 max-w-xl text-4xl md:text-5xl">
          Every community we&apos;re building
        </h1>
        <p className="mt-4 max-w-prose text-base text-ink-soft">
          Explore what we are planning and developing, from land and plots
          to apartments. Each project page shares the location, unit
          options, features and current status.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {categoryTabs.map((tab) => {
            const active = tab.value === activeCategory;
            return (
              <Link
                key={tab.value}
                href={tabHref(activeStatus, tab.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                  active
                    ? "border-garden-500 bg-garden-500 text-white"
                    : "border-limestone-300 text-ink-soft hover:border-garden-300 hover:text-garden-700"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const active = tab.value === activeStatus;
            return (
              <Link
                key={tab.value}
                href={tabHref(tab.value, activeCategory)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                  active
                    ? "border-sky bg-sky text-white"
                    : "border-limestone-300 text-ink-soft hover:border-sky hover:text-sky-dark"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-10">
          <ProjectGrid projects={projects} />
        </div>
      </Container>
    </Section>
  );
}
