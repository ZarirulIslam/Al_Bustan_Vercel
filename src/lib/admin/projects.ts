import { prisma } from "@/lib/prisma";
import { mapProject, projectWithImages } from "@/lib/data/mapProject";
import type { Project, ProjectCategory } from "@/lib/types";

export async function getAllProjectsAdmin(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: projectWithImages,
  });
  return rows.map(mapProject);
}

export async function getProjectByIdAdmin(id: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({
    where: { id },
    include: projectWithImages,
  });
  return row ? mapProject(row) : null;
}

export async function getProjectCounts() {
  const [total, ongoing, completed, upcoming, published, unpublished] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ongoing" } }),
    prisma.project.count({ where: { status: "completed" } }),
    prisma.project.count({ where: { status: "upcoming" } }),
    prisma.project.count({ where: { published: true } }),
    prisma.project.count({ where: { published: false } }),
  ]);
  return { total, ongoing, completed, upcoming, published, unpublished };
}

export async function getProjectsByCategoryAdmin(category: ProjectCategory): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: { category },
    orderBy: { updatedAt: "desc" },
    include: projectWithImages,
  });
  return rows.map(mapProject);
}
