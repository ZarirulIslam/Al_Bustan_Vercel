"use client";

import { useState, useTransition } from "react";
import type { ContactInquiry, InquiryStatus, LeadSource, PropertyType, SalesEmployee } from "@/lib/types";
import {
  updateInquiryStatus,
  updateInquiryLead,
  updateInquiryAssignment,
  deleteInquiry,
} from "@/app/admin/(dashboard)/inquiries/actions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const statusLabels: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow-up",
  converted: "Converted",
  closed: "Closed",
};

const statusStyles: Record<InquiryStatus, string> = {
  new: "bg-garden-100 text-garden-700",
  contacted: "bg-brass/20 text-brass-dark",
  follow_up: "bg-sky-50 text-sky-dark",
  converted: "bg-garden-600/15 text-garden-700",
  closed: "bg-limestone-200 text-ink-soft",
};

const statusDots: Record<InquiryStatus, string> = {
  new: "bg-garden-500",
  contacted: "bg-brass",
  follow_up: "bg-sky",
  converted: "bg-garden-600",
  closed: "bg-ink-soft/50",
};

const inquiryTypeLabels: Record<ContactInquiry["inquiryType"], string> = {
  general: "General Inquiry",
  buying: "Interested in Buying",
  site_visit: "Site Visit Request",
  pricing: "Pricing & Payment Plans",
  other: "Other",
};

const leadSourceLabels: Record<LeadSource, string> = {
  website: "Website",
  referral: "Referral",
  phone_call: "Phone Call",
  walk_in: "Walk-in",
  social_media: "Social Media",
  advertisement: "Advertisement",
  other: "Other",
};

const propertyTypeLabels: Record<PropertyType, string> = {
  land_plot: "Land / Plot",
  flat: "Flat / Apartment",
  commercial: "Commercial",
  other: "Other",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function followUpBadge(followUpDate: string | null, status: InquiryStatus) {
  if (!followUpDate || status === "converted" || status === "closed") return null;
  const due = new Date(followUpDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return { label: `Overdue · ${formatDateOnly(followUpDate)}`, className: "bg-red-50 text-red-700" };
  if (due.getTime() === today.getTime())
    return { label: "Follow up today", className: "bg-brass/20 text-brass-dark" };
  return { label: `Follow up ${formatDateOnly(followUpDate)}`, className: "bg-sky-50 text-sky-dark" };
}

function InquiryRow({
  inquiry,
  salesEmployees,
}: {
  inquiry: ContactInquiry;
  salesEmployees: SalesEmployee[];
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [managing, setManaging] = useState(false);

  const assignedEmployee = salesEmployees.find((e) => e.id === inquiry.assignedToId);

  const [leadSource, setLeadSource] = useState<LeadSource>(inquiry.leadSource);
  const [propertyType, setPropertyType] = useState<PropertyType | "">(inquiry.propertyType ?? "");
  const [budget, setBudget] = useState(inquiry.budget ?? "");
  const [customerNotes, setCustomerNotes] = useState(inquiry.customerNotes ?? "");
  const [followUpDate, setFollowUpDate] = useState(
    inquiry.followUpDate ? toDateInputValue(inquiry.followUpDate) : ""
  );

  const followUp = followUpBadge(inquiry.followUpDate, inquiry.status);

  function saveLead() {
    startTransition(() => {
      updateInquiryLead(inquiry.id, { leadSource, propertyType, budget, customerNotes, followUpDate });
    });
  }

  return (
    <div className="rounded-xl border border-limestone-300 bg-white p-5 shadow-card transition-shadow duration-300 ease-estate hover:shadow-card-hover">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">{inquiry.name}</p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusStyles[inquiry.status]
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", statusDots[inquiry.status])} />
              {statusLabels[inquiry.status]}
            </span>
            {followUp && (
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", followUp.className)}>
                {followUp.label}
              </span>
            )}
            <span className="rounded-full bg-limestone-200 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
              {assignedEmployee ? `Assigned: ${assignedEmployee.name}` : "Unassigned"}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{inquiry.subject}</p>
          <p className="mt-1 text-xs text-ink-soft">{inquiryTypeLabels[inquiry.inquiryType]}</p>
          {inquiry.projectName && (
            <p className="mt-1 text-xs text-garden-700">Re: {inquiry.projectName}</p>
          )}
        </div>
        <div className="text-right text-xs text-ink-soft">{formatDate(inquiry.createdAt)}</div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-ink-soft sm:grid-cols-2">
        <p>{inquiry.email}</p>
        <p>{inquiry.phone}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span>
          Source: <span className="text-ink">{leadSourceLabels[inquiry.leadSource]}</span>
        </span>
        {inquiry.propertyType && (
          <span>
            Property: <span className="text-ink">{propertyTypeLabels[inquiry.propertyType]}</span>
          </span>
        )}
        {inquiry.budget && (
          <span>
            Budget: <span className="text-ink">{inquiry.budget}</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-garden-700 hover:underline"
        >
          {expanded ? "Hide message" : "View message"}
        </button>
        <button
          type="button"
          onClick={() => setManaging((v) => !v)}
          className="text-xs font-medium text-garden-700 hover:underline"
        >
          {managing ? "Hide lead details" : "Manage lead"}
        </button>
      </div>

      {expanded && (
        <p className="mt-2 rounded-lg bg-limestone-100 p-3 text-sm text-ink-soft">{inquiry.message}</p>
      )}

      {managing && (
        <div className="mt-3 space-y-3 rounded-lg border border-limestone-300 bg-limestone-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs text-ink-soft" htmlFor={`source-${inquiry.id}`}>
                Lead Source
              </label>
              <select
                id={`source-${inquiry.id}`}
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                className="mt-1 w-full rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500"
              >
                {(Object.keys(leadSourceLabels) as LeadSource[]).map((value) => (
                  <option key={value} value={value}>
                    {leadSourceLabels[value]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-ink-soft" htmlFor={`propertyType-${inquiry.id}`}>
                Property Type
              </label>
              <select
                id={`propertyType-${inquiry.id}`}
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
                className="mt-1 w-full rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500"
              >
                <option value="">Not set</option>
                {(Object.keys(propertyTypeLabels) as PropertyType[]).map((value) => (
                  <option key={value} value={value}>
                    {propertyTypeLabels[value]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-ink-soft" htmlFor={`budget-${inquiry.id}`}>
                Budget
              </label>
              <input
                id={`budget-${inquiry.id}`}
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 50-70 Lakh"
                className="mt-1 w-full rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500"
              />
            </div>

            <div>
              <label className="text-xs text-ink-soft" htmlFor={`followUp-${inquiry.id}`}>
                Follow-up Date
              </label>
              <input
                id={`followUp-${inquiry.id}`}
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-soft" htmlFor={`notes-${inquiry.id}`}>
              Customer Notes
            </label>
            <textarea
              id={`notes-${inquiry.id}`}
              rows={3}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Internal notes about this lead…"
              className="mt-1 w-full resize-none rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500"
            />
          </div>

          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={isPending} onClick={saveLead}>
              {isPending ? "Saving…" : "Save lead details"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-limestone-300 pt-4">
        <label className="text-xs text-ink-soft" htmlFor={`status-${inquiry.id}`}>
          Status
        </label>
        <select
          id={`status-${inquiry.id}`}
          defaultValue={inquiry.status}
          disabled={isPending}
          onChange={(e) =>
            startTransition(() => updateInquiryStatus(inquiry.id, e.target.value as InquiryStatus))
          }
          className="rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500"
        >
          {(Object.keys(statusLabels) as InquiryStatus[]).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>

        <label className="text-xs text-ink-soft" htmlFor={`assignee-${inquiry.id}`}>
          Assigned To
        </label>
        <select
          id={`assignee-${inquiry.id}`}
          defaultValue={inquiry.assignedToId ?? ""}
          disabled={isPending}
          onChange={(e) =>
            startTransition(() => updateInquiryAssignment(inquiry.id, e.target.value || null))
          }
          className="rounded-lg border border-limestone-300 bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition-colors focus:border-garden-500"
        >
          <option value="">Unassigned</option>
          {salesEmployees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
              {!employee.active ? " (Inactive)" : ""}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isPending}
          className="ml-auto"
          onClick={() => {
            if (confirm("Delete this inquiry? This can't be undone.")) {
              startTransition(() => deleteInquiry(inquiry.id));
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export function InquiryTable({
  inquiries,
  salesEmployees,
}: {
  inquiries: ContactInquiry[];
  salesEmployees: SalesEmployee[];
}) {
  if (inquiries.length === 0) {
    return (
      <EmptyState
        title="No inquiries yet"
        description="Submissions from the contact form and project pages will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => (
        <InquiryRow key={inquiry.id} inquiry={inquiry} salesEmployees={salesEmployees} />
      ))}
    </div>
  );
}
