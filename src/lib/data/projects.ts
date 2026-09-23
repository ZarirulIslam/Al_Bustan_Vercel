import { prisma } from "@/lib/prisma";
import { mapProject, projectWithImages } from "@/lib/data/mapProject";
import type { Project, ProjectStatus } from "@/lib/types";

// Public, published-only data access. Admin CRUD (including
// unpublished projects) lives separately in src/lib/admin/projects.ts
// so that draft content never leaks onto public pages by accident.

// Admin-curated first (projects explicitly marked "Featured" at
// /admin/homepage, published and most recently updated first). If
// none have been curated yet — a fresh database, or before the admin
// has visited that page — falls back to one published project per
// status, same selection this function used before featuring existed,
// so the homepage section is never left empty by default.
export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  const curated = await prisma.project.findMany({
    where: { published: true, featured: true },
    orderBy: { updatedAt: "desc" },
    include: projectWithImages,
    take: limit,
  });
  if (curated.length > 0) return curated.map(mapProject);

  const statuses: ProjectStatus[] = ["ongoing", "completed", "upcoming"];
  const rows = await Promise.all(
    statuses.map((status) =>
      prisma.project.findFirst({
        where: { published: true, status },
        orderBy: { updatedAt: "desc" },
        include: projectWithImages,
      })
    )
  );
  return rows.filter((r): r is NonNullable<typeof r> => r !== null).slice(0, limit).map(mapProject);
}

export async function getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: { published: true, status },
    orderBy: { updatedAt: "desc" },
    include: projectWithImages,
  });
  return rows.map(mapProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const row = await prisma.project.findFirst({
    where: { slug, published: true },
    include: projectWithImages,
  });
  return row ? mapProject(row) : null;
}

export async function getAllPublishedProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    include: projectWithImages,
  });
  return rows.map(mapProject);
}
