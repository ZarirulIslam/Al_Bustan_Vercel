"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { Testimonial } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  deleteTestimonial,
  toggleTestimonialPublished,
  moveTestimonial,
} from "@/app/admin/(dashboard)/testimonials/actions";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TestimonialRow({
  testimonial,
  index,
  total,
}: {
  testimonial: Testimonial;
  index: number;
  total: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-limestone-300 bg-white p-5 shadow-card transition-shadow duration-300 ease-estate hover:shadow-card-hover sm:flex-row">
      <div className="flex flex-shrink-0 flex-row gap-3 sm:flex-col sm:items-center">
        {testimonial.photoUrl ? (
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-limestone-300">
            <Image src={testimonial.photoUrl} alt="" fill sizes="56px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-garden-100 text-sm font-semibold text-garden-700">
            {initials(testimonial.customerName)}
          </div>
        )}
        <div className="flex gap-2 sm:flex-col">
          <button
            type="button"
            disabled={isPending || index === 0}
            onClick={() => startTransition(() => moveTestimonial(testimonial.id, "up"))}
            className="rounded-lg border border-limestone-300 px-2 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={isPending || index === total - 1}
            onClick={() => startTransition(() => moveTestimonial(testimonial.id, "down"))}
            className="rounded-lg border border-limestone-300 px-2 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-ink">{testimonial.customerName}</p>
            {testimonial.designation && (
              <p className="text-sm text-ink-soft">{testimonial.designation}</p>
            )}
            {testimonial.projectName && (
              <p className="mt-0.5 text-xs text-garden-700">Re: {testimonial.projectName}</p>
            )}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => toggleTestimonialPublished(testimonial.id, !testimonial.published))
            }
            className={
              testimonial.published
                ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${testimonial.published ? "bg-garden-500" : "bg-ink-soft/50"}`}
            />
            {testimonial.published ? "Published" : "Unpublished"}
          </button>
        </div>

        <p className="mt-3 text-sm text-ink-soft">&ldquo;{testimonial.text}&rdquo;</p>

        <div className="mt-4 flex justify-end gap-2 border-t border-limestone-300 pt-4">
          <Button href={`/admin/testimonials/${testimonial.id}/edit`} variant="ghost" size="sm">
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Delete the testimonial from "${testimonial.customerName}"? This can't be undone.`)) {
                startTransition(() => deleteTestimonial(testimonial.id));
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TestimonialTable({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) {
    return (
      <EmptyState
        title="No testimonials yet"
        description='Click "Add Testimonial" to add the first one.'
        action={<Button href="/admin/testimonials/new">Add Testimonial</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {testimonials.map((testimonial, index) => (
        <TestimonialRow
          key={testimonial.id}
          testimonial={testimonial}
          index={index}
          total={testimonials.length}
        />
      ))}
    </div>
  );
}
