"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectFaqForm } from "@/components/admin/ProjectFaqForm";
import {
  deleteProjectFaq,
  moveProjectFaq,
  toggleProjectFaqPublished,
} from "@/app/admin/(dashboard)/projects/actions";
import type { ProjectFaq } from "@/lib/types";

export function ProjectFaqManager({ projectId, faqs }: { projectId: string; faqs: ProjectFaq[] }) {
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingFaq = editingId ? faqs.find((f) => f.id === editingId) : undefined;
  const showForm = adding || Boolean(editingFaq);

  function closeForm() {
    setAdding(false);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <ProjectFaqForm
          key={editingId ?? "new"}
          projectId={projectId}
          faq={editingFaq}
          onCancel={closeForm}
          onSaved={closeForm}
        />
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
          + Add FAQ
        </Button>
      )}

      {faqs.length === 0 ? (
        <EmptyState
          title="No FAQs yet"
          description="Add frequently asked questions for this project. They appear on the public project page, in the order shown below."
        />
      ) : (
        <div className="divide-y divide-limestone-300 overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">{faq.question}</p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => toggleProjectFaqPublished(faq.id, !faq.published))}
                  className={
                    faq.published
                      ? "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                      : "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                  }
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${faq.published ? "bg-garden-500" : "bg-ink-soft/50"}`} />
                  {faq.published ? "Published" : "Hidden"}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{faq.answer}</p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending || index === 0}
                  onClick={() => startTransition(() => moveProjectFaq(faq.id, "up"))}
                  className="rounded-lg border border-limestone-300 px-3 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-limestone-300 disabled:hover:text-ink-soft"
                >
                  ↑ Move up
                </button>
                <button
                  type="button"
                  disabled={isPending || index === faqs.length - 1}
                  onClick={() => startTransition(() => moveProjectFaq(faq.id, "down"))}
                  className="rounded-lg border border-limestone-300 px-3 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-limestone-300 disabled:hover:text-ink-soft"
                >
                  ↓ Move down
                </button>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(faq.id);
                    setAdding(false);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm("Delete this FAQ? This can't be undone.")) {
                      startTransition(() => deleteProjectFaq(faq.id));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
