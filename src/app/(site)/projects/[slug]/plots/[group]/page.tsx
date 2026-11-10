import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlotBrowser } from "@/components/project/PlotBrowser";
import { getProjectBySlug } from "@/lib/data/projects";
import { getInventoryForProject } from "@/lib/data/inventory";
import { getPlotGroupsForProject, toPublicPlots } from "@/lib/data/plotGroups";
import { blockLabel, groupByBlock, groupFullName, sameBlock } from "@/lib/plotLayout";
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
  const title = `${groupFullName(group)} প্লট — ${project.name}`;
  const description =
    group.description || `${project.name}-এর ${groupFullName(group)} প্লটগুলোর লেআউট — কোনটি খালি, কোনটি বিক্রিত দেখুন ও বুক করুন।`;
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
  const blocks = groupByBlock(groups, (g) => g);
  // Sub-category tabs: the sizes in this category's block.
  const sizes = groups.filter((g) => sameBlock(g.block, group.block));
  const availableIn = (groupId: string) =>
    inventory.filter((i) => i.groupId === groupId && i.gridRow && i.status === "available").length;

  return (
    <div lang="bn" className="bg-gradient-to-b from-garden-50 via-limestone-100 to-limestone pb-20 pt-12 md:pb-28 md:pt-16">
      <div className="container-content">
        <nav className="text-sm text-ink-soft">
          <Link href={`/projects/${project.slug}`} className="hover:text-garden-700">
            {project.name}
          </Link>{" "}
          /{" "}
          <Link href={`/projects/${project.slug}#plot-list`} className="hover:text-garden-700">
            প্লট তালিকা
          </Link>
          {group.block && <> / {blockLabel(group.block)}</>}
        </nav>
        <h1 className="mt-3 text-3xl font-bold leading-snug md:text-5xl">
          {group.block && <span className="block text-xl text-garden-700 md:text-2xl">{blockLabel(group.block)}</span>}
          {group.name} <span className="text-garden-600">প্লট</span>
        </h1>
        {group.description && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{group.description}</p>}

        {blocks.some((b) => b.block) && (
          <div className="-mx-4 mt-8 overflow-x-auto px-4">
            <div className="flex w-max gap-2">
              {blocks.map((b) => {
                const current = b.items.some((g) => g.id === group.id);
                return (
                  <Link
                    key={b.key}
                    href={`/projects/${project.slug}/plots/${(current ? group : b.items[0]).slug}`}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-2xl border-2 px-4 py-2 text-sm font-bold transition-colors sm:px-5 sm:text-base",
                      current
                        ? "border-garden-700 bg-garden-700 text-white"
                        : "border-limestone-300 bg-white text-ink hover:border-garden-500"
                    )}
                  >
                    {b.block ? blockLabel(b.block) : "অন্যান্য"}
                    <span className={cn("ml-2 text-xs font-medium", current ? "text-white/80" : "text-ink-soft")}>
                      {bn(b.items.reduce((n, g) => n + availableIn(g.id), 0))} খালি
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {sizes.length > 1 && (
          <div className="-mx-4 mt-4 overflow-x-auto px-4">
            <div className="flex w-max gap-2">
              {sizes.map((g) => (
                <Link
                  key={g.id}
                  href={`/projects/${project.slug}/plots/${g.slug}`}
                  aria-current={g.id === group.id ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors sm:px-5",
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

        <div className="mt-8">
          {plots.length > 0 ? (
            <PlotBrowser projectId={project.id} projectName={project.name} group={group} plots={plots} />
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
