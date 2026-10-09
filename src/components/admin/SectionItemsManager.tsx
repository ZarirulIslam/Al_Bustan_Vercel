"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { ProjectSectionItemForm } from "@/components/admin/ProjectSectionItemForm";
import {
  deleteProjectSectionItem,
  moveProjectSectionItem,
  toggleProjectSectionItemPublished,
} from "@/app/admin/(dashboard)/projects/actions";
import { PROJECT_SECTIONS } from "@/lib/projectSections";
import type { ProjectItemSection, ProjectSectionItem } from "@/lib/types";
import { useAdminAction } from "@/components/admin/AdminToaster";
import { cn } from "@/lib/utils";

const moveButtonClass =
  "rounded-lg border border-limestone-300 px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-limestone-300 disabled:hover:text-ink-soft";

// Editable list for one page section (amenities, floor plans, …), shown
// inside the matching step of the Land / Apartment project editor.
// Changes save instantly — separate from the editor's Save button.
export function SectionItemsManager({
  projectId,
  section,
  items,
  title,
}: {
  projectId: string;
  section: ProjectItemSection;
  items: ProjectSectionItem[];
  title?: string;
}) {
  const config = PROJECT_SECTIONS[section];
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { run, isPending } = useAdminAction();
  const editingItem = editingId ? items.find((i) => i.id === editingId) : undefined;

  function closeForm() {
    setAdding(false);
    setEditingId(null);
  }

  return (
    <div className="rounded-xl border border-limestone-300 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base text-ink">
            {title ?? config.label}
            <span className="rounded-full bg-garden-100 px-2 text-xs text-garden-700">{items.length}</span>
          </h3>
          <p className="mt-1 max-w-xl text-xs text-ink-soft">
            {config.hint} Changes here save instantly.
          </p>
        </div>
        {!adding && !editingItem && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
            + Add item
          </Button>
        )}
      </div>

      {(adding || editingItem) && (
        <div className="mt-4">
          <ProjectSectionItemForm
            key={editingId ?? "new"}
            projectId={projectId}
            section={section}
            item={editingItem}
            onCancel={closeForm}
            onSaved={closeForm}
          />
        </div>
      )}

      {items.length === 0 ? (
        !adding && (
          <p className="mt-4 rounded-lg border border-dashed border-limestone-300 px-4 py-6 text-center text-sm text-ink-soft">
            Nothing here yet — this part of the page stays hidden until you add a published item.
          </p>
        )
      ) : (
        <ul className="mt-4 divide-y divide-limestone-300 overflow-hidden rounded-lg border border-limestone-300">
          {items.map((item, index) => (
            <li key={item.id} className={cn("flex items-start gap-4 p-4", !item.published && "bg-limestone-100")}>
              {item.imageUrl ? (
                <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border border-limestone-300">
                  <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                </div>
              ) : config.icon ? (
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-garden-50 text-garden-700">
                  <ContentIcon icon={item.icon} />
                </span>
              ) : (
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-limestone-200 text-sm font-semibold text-ink-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className={cn("font-medium", item.published ? "text-ink" : "text-ink-soft")}>{item.title}</p>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      run(
                        () => toggleProjectSectionItemPublished(item.id, !item.published),
                        item.published ? "Item hidden." : "Item published."
                      )
                    }
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
                {(item.description || item.tab) && (
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                    {config.tabs && (
                      <span className="mr-2 rounded bg-limestone-200 px-1.5 py-0.5 text-xs">
                        {config.tabs.find((t) => t.value === item.tab)?.label ?? item.tab}
                      </span>
                    )}
                    {item.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={isPending || index === 0}
                    onClick={() => run(() => moveProjectSectionItem(item.id, "up"))}
                    className={moveButtonClass}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={isPending || index === items.length - 1}
                    onClick={() => run(() => moveProjectSectionItem(item.id, "down"))}
                    className={moveButtonClass}
                  >
                    ↓
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
                        run(() => deleteProjectSectionItem(item.id), "Item deleted.");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
