import Link from "next/link";
import { InquiryTable } from "@/components/admin/InquiryTable";
import {
  getAllInquiriesAdmin,
  getInquiryCounts,
  getInquiryProjectOptions,
} from "@/lib/admin/inquiries";
import { getAllSalesEmployeesAdmin } from "@/lib/admin/salesTeam";
import { cn } from "@/lib/utils";
import type { InquiryStatus, LeadSource } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusTabs: { label: string; value: InquiryStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Follow-up", value: "follow_up" },
  { label: "Converted", value: "converted" },
  { label: "Closed", value: "closed" },
];

const leadSourceLabels: Record<LeadSource, string> = {
  website: "Website",
  referral: "Referral",
  phone_call: "Phone Call",
  walk_in: "Walk-in",
  social_media: "Social Media",
  advertisement: "Advertisement",
  other: "Other",
};

interface AdminInquiriesPageProps {
  searchParams: Promise<{
    status?: string;
    project?: string;
    source?: string;
    from?: string;
    to?: string;
    q?: string;
    assignee?: string;
  }>;
}

export default async function AdminInquiriesPage({ searchParams }: AdminInquiriesPageProps) {
  const { status, project, source, from, to, q, assignee } = await searchParams;

  const activeStatus = (
    ["new", "contacted", "follow_up", "converted", "closed"].includes(status ?? "")
      ? status
      : "all"
  ) as InquiryStatus | "all";
  const activeSource = (
    Object.keys(leadSourceLabels).includes(source ?? "") ? source : undefined
  ) as LeadSource | undefined;

  const [inquiries, counts, projectOptions, salesEmployees] = await Promise.all([
    getAllInquiriesAdmin({
      status: activeStatus === "all" ? undefined : activeStatus,
      projectId: project || undefined,
      leadSource: activeSource,
      search: q || undefined,
      dateFrom: from || undefined,
      dateTo: to || undefined,
      assignedTo: assignee || undefined,
    }),
    getInquiryCounts(),
    getInquiryProjectOptions(),
    getAllSalesEmployeesAdmin(),
  ]);

  const tabCounts: Record<InquiryStatus | "all", number> = {
    all: counts.total,
    new: counts.new,
    contacted: counts.contacted,
    follow_up: counts.followUp,
    converted: counts.converted,
    closed: counts.closed,
  };

  const hasFilters = Boolean(project || source || from || to || q || assignee);

  // Preserve the current status tab when other filters are applied
  // via the form below (the tabs are plain links driven by ?status=,
  // the rest of the filters are a single GET form).
  const statusHref = (value: InquiryStatus | "all") => {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    if (project) params.set("project", project);
    if (source) params.set("source", source);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q) params.set("q", q);
    if (assignee) params.set("assignee", assignee);
    const qs = params.toString();
    return qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
  };

  // Clear filters keeps only the active status tab, dropping search/project/source/date.
  const clearFiltersHref = activeStatus === "all" ? "/admin/inquiries" : `/admin/inquiries?status=${activeStatus}`;

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Leads &amp; Inquiries</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Submissions from the contact form and project inquiry forms, tracked as leads through
          follow-up and conversion.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = tab.value === activeStatus;
          return (
            <Link
              key={tab.value}
              href={statusHref(tab.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                active
                  ? "border-garden-500 bg-garden-500 text-white"
                  : "border-limestone-300 text-ink-soft hover:border-garden-300 hover:text-garden-700"
              )}
            >
              {tab.label} ({tabCounts[tab.value]})
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-limestone-300 bg-white p-4 shadow-card"
      >
        {status && <input type="hidden" name="status" value={status} />}

        <div className="min-w-[180px] flex-1">
          <label htmlFor="q" className="text-xs text-ink-soft">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Name, email, phone, subject…"
            className="mt-1 w-full rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          />
        </div>

        <div>
          <label htmlFor="project" className="text-xs text-ink-soft">
            Project
          </label>
          <select
            id="project"
            name="project"
            defaultValue={project ?? ""}
            className="mt-1 rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          >
            <option value="">All projects</option>
            {projectOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="source" className="text-xs text-ink-soft">
            Lead Source
          </label>
          <select
            id="source"
            name="source"
            defaultValue={source ?? ""}
            className="mt-1 rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          >
            <option value="">All sources</option>
            {(Object.keys(leadSourceLabels) as LeadSource[]).map((value) => (
              <option key={value} value={value}>
                {leadSourceLabels[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assignee" className="text-xs text-ink-soft">
            Assigned To
          </label>
          <select
            id="assignee"
            name="assignee"
            defaultValue={assignee ?? ""}
            className="mt-1 rounded-lg border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-garden-500"
          >
            <option value="">Everyone</option>
            <option value="unassigned">Unassigned</option>
            {salesEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
                {!employee.active ? " (Inactive)" : ""}
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
        <InquiryTable inquiries={inquiries} salesEmployees={salesEmployees} />
      </div>
    </div>
  );
}
