"use client";

import { useAdminAction } from "@/components/admin/AdminToaster";
import { setTeamSectionVisibility } from "@/app/admin/(dashboard)/team/actions";

function VisibilitySwitch({
  page,
  label,
  description,
  enabled,
}: {
  page: "home" | "about";
  label: string;
  description: string;
  enabled: boolean;
}) {
  const { run, isPending } = useAdminAction();

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-limestone-300 bg-white px-5 py-4 shadow-card">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={isPending}
        onClick={() =>
          run(
            () => setTeamSectionVisibility(page, !enabled),
            `Team section ${enabled ? "hidden on" : "shown on"} the ${page === "home" ? "homepage" : "About page"}.`
          )
        }
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
          enabled ? "bg-garden-500" : "bg-limestone-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// Section-level visibility for the shared team directory — each page is
// switched on/off independently; member data is the same on both.
export function TeamSectionVisibility({ home, about }: { home: boolean; about: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <VisibilitySwitch
        page="home"
        label="Show on Home"
        description={home ? "The team section is visible on the homepage." : "Hidden on the homepage."}
        enabled={home}
      />
      <VisibilitySwitch
        page="about"
        label="Show on About"
        description={about ? "The team section is visible on the About page." : "Hidden on the About page."}
        enabled={about}
      />
    </div>
  );
}
