import { RedirectTable } from "@/components/admin/RedirectTable";
import { Button } from "@/components/ui/Button";
import { getAllRedirectsAdmin } from "@/lib/admin/redirects";

export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage() {
  const redirects = await getAllRedirectsAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-limestone-300 pb-6">
        <div>
          <h1 className="text-3xl">SEO Redirects</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Send visitors from an old URL to a new one. Changes take effect within about a minute.
          </p>
        </div>
        <Button href="/admin/redirects/new">Add Redirect</Button>
      </div>

      <div className="mt-8">
        <RedirectTable redirects={redirects} />
      </div>
    </div>
  );
}
