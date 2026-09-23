import { RedirectForm } from "@/components/admin/RedirectForm";
import { createRedirect } from "@/app/admin/(dashboard)/redirects/actions";

export default function NewRedirectPage() {
  return (
    <div>
      <h1 className="text-3xl">Add Redirect</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Send visitors from an old URL to a new one, without a code change.
      </p>

      <div className="mt-8 max-w-2xl">
        <RedirectForm action={createRedirect} submitLabel="Add Redirect" />
      </div>
    </div>
  );
}
