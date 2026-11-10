import { notFound, redirect } from "next/navigation";
import { getProjectBySlug } from "@/lib/data/projects";
import { getPlotGroupsForProject } from "@/lib/data/plotGroups";
import { groupByBlock } from "@/lib/plotLayout";

export const revalidate = 0;

// /projects/[slug]/plots → the project's first plot category (first block's first size).
export default async function PlotsIndexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const groups = await getPlotGroupsForProject(project.id);
  // Same order as the site's tabs: blocks first, categories without a block last.
  const first = groupByBlock(groups, (g) => g)[0]?.items[0];
  redirect(first ? `/projects/${project.slug}/plots/${first.slug}` : `/projects/${project.slug}`);
}
