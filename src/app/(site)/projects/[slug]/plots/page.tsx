import { notFound, redirect } from "next/navigation";
import { getProjectBySlug } from "@/lib/data/projects";
import { getPlotGroupsForProject } from "@/lib/data/plotGroups";

export const revalidate = 0;

// /projects/[slug]/plots → the project's first plot category.
export default async function PlotsIndexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const [first] = await getPlotGroupsForProject(project.id);
  redirect(first ? `/projects/${project.slug}/plots/${first.slug}` : `/projects/${project.slug}`);
}
