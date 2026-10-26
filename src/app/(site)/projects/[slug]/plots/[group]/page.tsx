import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlotLayout, PlotLegend } from "@/components/project/PlotLayout";
import { getProjectBySlug } from "@/lib/data/projects";
import { getInventoryForProject } from "@/lib/data/inventory";
import { getPlotGroupsForProject, toPublicPlots } from "@/lib/data/plotGroups";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

async function load(slug: string, groupSlug: string) {
  const project = await getProjectBySlug(slug);
  if (!project || project.category !== "land_plot") return null;
  const groups = await getPlotGroupsForProject(project.id);
  const group = groups.find((g) => g.slug === groupSlug);
  if (!group) return null;
  return { project, groups, group };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; group: string }>;
}): Promise<Metadata> {
  const { slug, group: groupSlug } = await params;
  const data = await load(slug, groupSlug);
  if (!data) return {};
  const { project, group } = data;
  const title = `${group.name} প্লট — ${project.name}`;
  const description =
    group.description || `${project.name}-এর ${group.name} প্লটগুলোর লেআউট — কোনটি খালি, কোনটি বিক্রিত দেখুন ও বুক করুন।`;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}/plots/${group.slug}` },
    ...(project.noIndex && { robots: { index: false, follow: false } }),
    openGraph: { title, description, images: [{ url: project.ogImageUrl || project.coverImage.url }] },
  };
}

// One plot category of a land project (৩ কাঠা, বাণিজ্যিক, …) as a
// bus-seat-style layout: free plots can be clicked to send a booking
// request, sold/booked ones show who has them. Managed from the Land
// editor's প্লট তালিকা step.
export default async function PlotCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; group: string }>;
}) {
  const { slug, group: groupSlug } = await params;
  const data = await load(slug, groupSlug);
  if (!data) notFound();
  const { project, groups, group } = data;

  const inventory = await getInventoryForProject(project.id);
  const plots = toPublicPlots(inventory, group.id);
  const count = (status: "available" | "reserved" | "sold") => plots.filter((p) => p.status === status).length;
  const availableIn = (groupId: string) =>
    inventory.filter((i) => i.groupId === groupId && i.gridRow && i.status === "available").length;

  return (
    <div lang="bn" className="bg-gradient-to-b from-garden-50 via-limestone-100 to-limestone pb-20 pt-12 md:pb-28 md:pt-16">
      <div className="container-content">
        <nav className="text-sm text-ink-soft">
          <Link href={`/projects/${project.slug}`} className="hover:text-garden-700">
            {project.name}
          </Link>{" "}
          / প্লট তালিকা
        </nav>
        <h1 className="mt-3 text-3xl font-bold leading-snug md:text-5xl">
          {group.name} <span className="text-garden-600">প্লট</span>
        </h1>
        {group.description && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{group.description}</p>}

        {groups.length > 1 && (
          <div className="-mx-4 mt-8 overflow-x-auto px-4">
            <div className="flex w-max gap-2">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/projects/${project.slug}/plots/${g.slug}`}
                  aria-current={g.id === group.id ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                    g.id === group.id
                      ? "border-garden-500 bg-garden-500 text-white"
                      : "border-limestone-300 bg-white text-ink hover:border-garden-500 hover:text-garden-700"
                  )}
                >
                  {g.name}
                  <span className={cn("ml-2 text-xs font-medium", g.id === group.id ? "text-white/80" : "text-ink-soft")}>
                    {bn(availableIn(g.id))} খালি
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <PlotLegend />
          <p className="text-sm text-ink-soft">
            মোট {bn(plots.length)} · খালি {bn(count("available"))} · বুকড {bn(count("reserved"))} · বিক্রিত{" "}
            {bn(count("sold"))}
          </p>
        </div>

        <div className="mt-5">
          {plots.length > 0 ? (
            <PlotLayout
              projectId={project.id}
              projectName={project.name}
              categoryName={group.name}
              rows={group.rows}
              columns={group.columns}
              plots={plots}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-limestone-300 bg-white px-6 py-12 text-center text-ink-soft">
              এই ক্যাটাগরির প্লট তালিকা শীঘ্রই প্রকাশ করা হবে।
            </p>
          )}
        </div>
        {plots.length > 0 && (
          <p className="mt-4 text-center text-sm text-ink-soft">
            যেকোনো প্লটে ক্লিক করে বিস্তারিত দেখুন — খালি প্লট সরাসরি বুক করতে পারবেন।
          </p>
        )}
      </div>
    </div>
  );
}
