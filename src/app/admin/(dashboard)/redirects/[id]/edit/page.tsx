import { notFound } from "next/navigation";
import { RedirectForm } from "@/components/admin/RedirectForm";
import { updateRedirect } from "@/app/admin/(dashboard)/redirects/actions";
import { getRedirectByIdAdmin } from "@/lib/admin/redirects";

export const dynamic = "force-dynamic";

export default async function EditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const redirectRule = await getRedirectByIdAdmin(id);
  if (!redirectRule) notFound();

  const boundUpdate = updateRedirect.bind(null, redirectRule.id);

  return (
    <div>
      <h1 className="text-3xl">Edit Redirect</h1>
      <p className="mt-1 text-sm text-ink-soft">{redirectRule.fromPath}</p>

      <div className="mt-8 max-w-2xl">
        <RedirectForm action={boundUpdate} redirect={redirectRule} submitLabel="Save Changes" />
      </div>
    </div>
  );
}
