import { EditProjectPage } from "@/components/admin/project-editor/pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditProjectPage id={id} category="flat" />;
}
