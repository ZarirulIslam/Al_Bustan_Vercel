import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActivityLogsAdmin, getDistinctActivityResources } from "@/lib/admin/activityLogs";
import { cn } from "@/lib/utils";
import type { ActivityAction } from "@/lib/types";

export const dynamic = "force-dynamic";

const actionTabs: { label: string; value: ActivityAction | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Created", value: "created" },
  { label: "Updated", value: "updated" },
  { label: "Deleted", value: "deleted" },
  { label: "Published", value: "published" },
  { label: "Unpublished", value: "unpublished" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ActivityLogsPageProps {
  searchParams: Promise<{
    action?: string;
    resource?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}

export default async function ActivityLogsPage({ searchParams }: ActivityLogsPageProps) {
  const { action, resource, from, to, q } = await searchParams;

  const activeAction = (
    ["created", "updated", "deleted", "published", "unpublished"].includes(action ?? "")
      ? action
      : "all"
  ) as ActivityAction | "all";

  const [logs, resources] = await Promise.all([
    getActivityLogsAdmin({
      action: activeAction === "all" ? undefined : activeAction,
      resource: resource || undefined,
      dateFrom: from || undefined,
      dateTo: to || undefined,
      q: q || undefined,
    }),
    getDistinctActivityResources(),
  ]);

  const hasFilters = Boolean(resource || from || to || q);

  const actionHref = (value: ActivityAction | "all") => {
    const params = new URLSearchParams();
    if (value !== "all") params.set("action", value);
    if (resource) params.set("resource", resource);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/activity-logs?${qs}` : "/admin/activity-logs";
  };

  const clearFiltersHref =
    activeAction === "all" ? "/admin/activity-logs" : `/admin/activity-logs?action=${activeAction}`;

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Activity Logs</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          A record of consequential admin actions — creates, updates, deletes, and publish/unpublish
          toggles across the CMS. Most recent 200 shown, matching the filters below.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {actionTabs.map((tab) => {
          const active = tab.value === activeAction;
          return (
            <Link
              key={tab.value}
              href={actionHref(tab.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                active
                  ? "border-garden-500 bg-garden-500 text-white"
                  : "border-limestone-300 text-ink-soft hover:border-garden-300 hover:text-garden-700"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-limestone-300 bg-white p-4 shadow-card"
      >
        {action && <input type="hidden" name="action" value={action} />}

        <div className="min-w-[180px] flex-1">
          <label htmlFor="q" className="text-xs text-ink-soft">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Admin email or description…"
            className="mt-1 w-full rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          />
        </div>

        <div>
          <label htmlFor="resource" className="text-xs text-ink-soft">
            Resource
          </label>
          <select
            id="resource"
            name="resource"
            defaultValue={resource ?? ""}
            className="mt-1 rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          >
            <option value="">All resources</option>
            {resources.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="from" className="text-xs text-ink-soft">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="mt-1 rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          />
        </div>

        <div>
          <label htmlFor="to" className="text-xs text-ink-soft">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="mt-1 rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-garden-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-estate hover:bg-garden-600"
        >
          Apply
        </button>
        {hasFilters && (
          <Link
            href={clearFiltersHref}
            className="rounded-lg border border-limestone-300 px-4 py-2 text-sm font-medium text-ink-soft transition-colors duration-200 ease-estate hover:border-garden-300 hover:text-garden-700"
          >
            Clear filters
          </Link>
        )}
      </form>

      <div className="mt-8">
        {logs.length === 0 ? (
          <EmptyState
            title="No activity found"
            description="Consequential admin actions (creates, updates, deletes, publish toggles) will appear here as they happen."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-limestone-300 bg-limestone-100 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">When</th>
                  <th className="px-4 py-3.5 font-semibold">Admin</th>
                  <th className="px-4 py-3.5 font-semibold">Action</th>
                  <th className="px-4 py-3.5 font-semibold">Resource</th>
                  <th className="px-4 py-3.5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-limestone-300 transition-colors duration-150 last:border-0 hover:bg-limestone-100/70"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-soft">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft">{log.adminEmail}</td>
                    <td className="px-4 py-3.5 capitalize text-ink-soft">{log.action}</td>
                    <td className="px-4 py-3.5 text-ink-soft">{log.resource}</td>
                    <td className="px-4 py-3.5 text-ink">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
