import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { getProjectsByCategoryAdmin } from "@/lib/admin/projects";
import { projectAdminBase } from "@/lib/projectSections";
import type { ProjectCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

// Entry point for projects: Land and Apartment projects live in separate
// areas of the CMS because their pages (and content) are different.
const AREAS: { category: ProjectCategory; title: string; icon: string; language: string; points: string[] }[] = [
  {
    category: "land_plot",
    title: "Land Projects",
    icon: "land",
    language: "Bangla page",
    points: ["পরিচিতি, অবস্থান (video + cards), বৈশিষ্ট্য", "প্লট tabs, লক্ষ্য, gallery & videos", "Location map, security, amenities, plot booking"],
  },
  {
    category: "flat",
    title: "Apartment Projects",
    icon: "building",
    language: "English page",
    points: ["Hero slider & stat bar", "Overview & technical specification", "Amenities, key plan, gallery"],
  },
];

export default async function AdminProjectsPage() {
  const lists = await Promise.all(AREAS.map((a) => getProjectsByCategoryAdmin(a.category)));

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Projects</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
          Land and apartment projects have different pages, so each has its own area with an editor laid out like its
          page.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {AREAS.map((area, i) => {
          const projects = lists[i];
          const published = projects.filter((p) => p.published).length;
          const base = projectAdminBase(area.category);
          return (
            <section key={area.category} className="flex flex-col rounded-2xl border border-limestone-300 bg-white p-6 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-garden-50 text-garden-600">
                  <ContentIcon icon={area.icon} className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-limestone-200 px-2.5 py-1 text-xs text-ink-soft">{area.language}</span>
              </div>
              <h2 className="mt-4 text-2xl">
                <Link href={base} className="hover:text-garden-700">
                  {area.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {projects.length} {projects.length === 1 ? "project" : "projects"} · {published} published
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                {area.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-garden-500">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              {projects.length > 0 && (
                <ul className="mt-5 divide-y divide-limestone-300 rounded-lg border border-limestone-300">
                  {projects.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`${base}/${p.id}/edit`}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-limestone-100"
                      >
                        <span className="truncate text-ink">{p.name}</span>
                        <span className="flex-shrink-0 text-xs text-ink-soft">{p.published ? "Published" : "Draft"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                <Button href={base} variant="ghost">
                  Open {area.title.toLowerCase()}
                </Button>
                <Button href={`${base}/new`}>Add new</Button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
