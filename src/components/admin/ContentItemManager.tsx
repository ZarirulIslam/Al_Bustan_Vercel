"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { ContentItemForm } from "@/components/admin/ContentItemForm";
import {
  deleteContentItem,
  moveContentItem,
  toggleContentItemPublished,
} from "@/lib/admin/contentItemActions";
import type { ContentItem, ContentSection } from "@/lib/types";
import { useAdminAction } from "@/components/admin/AdminToaster";

export function ContentItemManager({
  section,
  items,
  addLabel = "+ Add Item",
}: {
  section: ContentSection;
  items: ContentItem[];
  addLabel?: string;
}) {
  const { run, isPending } = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = editingId ? items.find((i) => i.id === editingId) : undefined;
  const showForm = adding || Boolean(editingItem);

  function closeForm() {
    setAdding(false);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <ContentItemForm key={editingId ?? "new"} section={section} item={editingItem} onCancel={closeForm} onSaved={closeForm} />
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
          {addLabel}
        </Button>
      )}

      {items.length === 0 ? (
        <EmptyState title="No items yet" description="Add the first item using the button above." />
      ) : (
        <div className="divide-y divide-limestone-300 overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-4 p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-garden-100 text-garden-700">
                <ContentIcon icon={item.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{item.title}</p>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => toggleContentItemPublished(item.id, section, !item.published), item.published ? "Item unpublished." : "Item published.")}
                    className={
                      item.published
                        ? "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                        : "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
                    }
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${item.published ? "bg-garden-500" : "bg-ink-soft/50"}`} />
                    {item.published ? "Published" : "Hidden"}
                  </button>
                </div>
                {item.description && <p className="mt-2 text-sm text-ink-soft">{item.description}</p>}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending || index === 0}
                    onClick={() => run(() => moveContentItem(item.id, section, "up"))}
                    className="rounded-lg border border-limestone-300 px-3 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-limestone-300 disabled:hover:text-ink-soft"
                  >
                    ↑ Move up
                  </button>
                  <button
                    type="button"
                    disabled={isPending || index === items.length - 1}
                    onClick={() => run(() => moveContentItem(item.id, section, "down"))}
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
                      setEditingId(item.id);
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
                      if (confirm(`Delete "${item.title}"? This can't be undone.`)) {
                        run(() => deleteContentItem(item.id, section), "Item deleted.");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
