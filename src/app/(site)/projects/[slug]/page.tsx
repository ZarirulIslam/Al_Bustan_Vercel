import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandProjectView } from "@/components/project/LandProjectView";
import { ApartmentProjectView } from "@/components/project/ApartmentProjectView";
import { getAllPublishedProjects, getProjectBySlug } from "@/lib/data/projects";
import { getPublishedSectionItemsForProject } from "@/lib/data/projectSectionItems";
import { getInventoryForProject } from "@/lib/data/inventory";
import { buildPlotSections, getPlotGroupsForProject } from "@/lib/data/plotGroups";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const title = project.seoTitle || project.name;
  const description = project.metaDescription || project.shortDescription;
  const ogImage = project.ogImageUrl || project.coverImage.url;

  return {
    title,
    description,
    alternates: {
      canonical: project.canonicalUrl || `/projects/${project.slug}`,
    },
    ...(project.noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
    },
  };
}

// The detail page has two layouts — Land/Plot projects (Bangla township
// page) and Flat/Apartment projects (English building page), each with
// exactly the sections of its reference design. Both are driven by the
// Project record plus its admin-managed page sections.
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const sections = await getPublishedSectionItemsForProject(project.id);

  if (project.category === "flat") {
    const others = (await getAllPublishedProjects()).filter((p) => p.id !== project.id);
    // Other apartments first, then everything else, so the strip is
    // never empty just because there's only one apartment project.
    const related = [
      ...others.filter((p) => p.category === "flat"),
      ...others.filter((p) => p.category !== "flat"),
    ].slice(0, 8);

    return <ApartmentProjectView project={project} sections={sections} related={related} />;
  }

  const [inventory, plotGroups] = await Promise.all([
    getInventoryForProject(project.id),
    getPlotGroupsForProject(project.id),
  ]);
  // Only what the public may see (no file numbers): categories with
  // plots on their layout, plus plots not placed on one yet.
  const plotSections = buildPlotSections(plotGroups, inventory);
  return <LandProjectView project={project} sections={sections} plotSections={plotSections} />;
}
