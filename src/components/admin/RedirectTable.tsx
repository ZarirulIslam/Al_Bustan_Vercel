"use client";

import { useTransition } from "react";
import type { Redirect } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteRedirect, toggleRedirectEnabled } from "@/app/admin/(dashboard)/redirects/actions";

const kindLabels: Record<Redirect["kind"], string> = {
  permanent: "301 Permanent",
  temporary: "302 Temporary",
};

export function RedirectTable({ redirects }: { redirects: Redirect[] }) {
  const [isPending, startTransition] = useTransition();

  if (redirects.length === 0) {
    return (
      <EmptyState
        title="No redirects yet"
        description='Click "Add Redirect" to create the first one.'
        action={<Button href="/admin/redirects/new">Add Redirect</Button>}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3.5 font-semibold">From</th>
            <th className="px-4 py-3.5 font-semibold">To</th>
            <th className="px-4 py-3.5 font-semibold">Type</th>
            <th className="px-4 py-3.5 font-semibold">Status</th>
            <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {redirects.map((r) => (
            <tr
              key={r.id}
              className="border-b border-limestone-300 transition-colors duration-150 last:border-0 hover:bg-limestone-100/70"
            >
              <td className="px-4 py-3.5 font-medium text-ink">{r.fromPath}</td>
              <td className="max-w-xs truncate px-4 py-3.5 text-ink-soft" title={r.toPath}>
                {r.toPath}
              </td>
              <td className="px-4 py-3.5 text-ink-soft">{kindLabels[r.kind]}</td>
              <td className="px-4 py-3.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => toggleRedirectEnabled(r.id, !r.enabled))}
                  className={
                    r.enabled
                      ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                      : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                  }
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${r.enabled ? "bg-garden-500" : "bg-ink-soft/50"}`} />
                  {r.enabled ? "Enabled" : "Disabled"}
                </button>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end gap-2">
                  <Button href={`/admin/redirects/${r.id}/edit`} variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(`Delete the redirect from "${r.fromPath}"? This can't be undone.`)) {
                        startTransition(() => deleteRedirect(r.id));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
