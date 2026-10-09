import { notFound, redirect } from "next/navigation";
import { getProjectByIdAdmin } from "@/lib/admin/projects";
import { projectEditPath } from "@/lib/projectSections";

// Old/shared edit link — forwards to the Land or Apartment editor.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectByIdAdmin(id);
  if (!project) notFound();
  redirect(projectEditPath(project));
}
