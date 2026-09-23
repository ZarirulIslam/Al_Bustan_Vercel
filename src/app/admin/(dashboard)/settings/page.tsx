import { SettingsForm } from "@/components/admin/SettingsForm";
import { updateSettings } from "@/app/admin/(dashboard)/settings/actions";
import { getSiteSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Website Settings</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Company info, contact details, social links, and default SEO —
          used across the whole public site.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <SettingsForm action={updateSettings} settings={settings} />
      </div>
    </div>
  );
}
