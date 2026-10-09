"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ProjectFormState } from "@/lib/admin/projectSchema";
import { cn } from "@/lib/utils";

// One step of a project editor — mirrors one section of the public
// project page. `fields` live inside the editor's single <form> (all
// steps' fields are always mounted, only the active one is visible, so
// one Save submits everything). `extra` holds lists that save on their
// own (page-section items, inventory, payment plans, FAQ) and renders
// below the step's fields, outside the form.
export interface EditorStep {
  id: string;
  label: string;
  title: string;
  description?: string;
  group: string;
  number?: string;
  // Anchor on the public page, for the "View on page" link.
  anchor?: string;
  fields?: ReactNode;
  extra?: ReactNode;
  // Item count shown in the step list (for list-based steps).
  count?: number;
  // Form field names in this step, so a server-side validation error
  // can jump straight to the step that holds it.
  fieldNames?: string[];
}

export const EDITOR_FORM_ID = "project-editor-form";

export function EditorShell({
  steps,
  formAction,
  state,
  isPending,
  uploading,
  formKey,
  publicUrl,
  published,
  submitLabel,
  isNew,
  category,
}: {
  steps: EditorStep[];
  formAction: (formData: FormData) => void;
  state: ProjectFormState;
  isPending: boolean;
  uploading: boolean;
  formKey: number;
  publicUrl?: string;
  published: boolean;
  submitLabel: string;
  isNew: boolean;
  category: "land_plot" | "flat";
}) {
  const [active, setActive] = useState(steps[0].id);
  const formRef = useRef<HTMLFormElement>(null);
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === active)
  );
  const step = steps[activeIndex];

  const go = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Deep links: /…/edit#gallery opens that step.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (fromHash && steps.some((s) => s.id === fromHash)) setActive(fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A server-side validation error jumps to the step holding the field.
  const errorKeys = Object.keys(state.fieldErrors ?? {});
  const stepsWithErrors = new Set(
    steps.filter((s) => s.fieldNames?.some((f) => errorKeys.includes(f))).map((s) => s.id)
  );
  useEffect(() => {
    const first = steps.find((s) => stepsWithErrors.has(s.id));
    if (first) setActive(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Browser validation on a field in a hidden step: show that step,
  // then let the browser point at the field.
  function onInvalidCapture(e: React.FormEvent<HTMLFormElement>) {
    const owner = (e.target as HTMLElement).closest<HTMLElement>("[data-step]");
    const id = owner?.dataset.step;
    if (id && id !== active) {
      setActive(id);
      requestAnimationFrame(() => (e.target as HTMLInputElement).reportValidity?.());
    }
  }

  const groups = steps.reduce<{ name: string; steps: EditorStep[] }[]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && last.name === s.group) last.steps.push(s);
    else acc.push({ name: s.group, steps: [s] });
    return acc;
  }, []);

  const accent = category === "flat" ? "bg-sky text-white" : "bg-garden-500 text-white";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Step navigation */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <label htmlFor="editor-step" className="sr-only">
          Section
        </label>
        <select
          id="editor-step"
          value={active}
          onChange={(e) => go(e.target.value)}
          className="w-full rounded-lg border border-limestone-300 bg-white px-3.5 py-2.5 text-sm lg:hidden"
        >
          {steps.map((s) => (
            <option key={s.id} value={s.id}>
              {s.number ? `${s.number} · ` : ""}
              {s.label}
            </option>
          ))}
        </select>

        <nav aria-label="Editor sections" className="hidden max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-limestone-300 bg-white p-2 shadow-card lg:block">
          {groups.map((group) => (
            <div key={group.name} className="py-1.5">
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft/60">
                {group.name}
              </p>
              {group.steps.map((s) => {
                const selected = s.id === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={selected ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150",
                      selected ? "bg-garden-700 text-white" : "text-ink-soft hover:bg-limestone-100 hover:text-ink"
                    )}
                  >
                    {s.number && (
                      <span className={cn("w-5 flex-shrink-0 text-xs tabular-nums", selected ? "text-brass-light" : "text-ink-soft/60")}>
                        {s.number}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    {stepsWithErrors.has(s.id) ? (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" aria-label="Has errors" />
                    ) : s.count !== undefined ? (
                      <span
                        className={cn(
                          "min-w-[1.4rem] rounded-full px-1.5 text-center text-[11px]",
                          selected ? "bg-white/20" : s.count > 0 ? "bg-garden-100 text-garden-700" : "bg-limestone-200"
                        )}
                      >
                        {s.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Active step */}
      <div className="min-w-0">
        <div className="rounded-xl border border-limestone-300 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-limestone-300 pb-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
                <span className={cn("rounded px-1.5 py-0.5 text-[10px]", accent)}>
                  {category === "flat" ? "Apartment page" : "Land page"}
                </span>
                {step.number && <span>Section {step.number}</span>}
              </p>
              <h2 className="mt-2 text-2xl">{step.title}</h2>
              {step.description && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{step.description}</p>}
            </div>
            {publicUrl && step.anchor && (
              <a
                href={`${publicUrl}#${step.anchor}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-garden-300 px-3 py-1.5 text-xs font-medium text-garden-700 transition-colors hover:bg-garden-50"
              >
                View on page ↗
              </a>
            )}
          </div>

          {state.error && (
            <p className="mt-5 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <form
            key={formKey}
            id={EDITOR_FORM_ID}
            ref={formRef}
            action={formAction}
            onInvalidCapture={onInvalidCapture}
          >
            {steps.map((s) =>
              s.fields ? (
                <div key={s.id} data-step={s.id} hidden={s.id !== active} className="mt-6 space-y-5">
                  {s.fields}
                </div>
              ) : null
            )}
          </form>

          {step.extra && <div className={cn(step.fields ? "mt-8" : "mt-6", "space-y-6")}>{step.extra}</div>}

          {!step.fields && !step.extra && (
            <p className="mt-6 text-sm text-ink-soft">Nothing to edit in this section.</p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-limestone-300 pt-5">
            <button
              type="button"
              onClick={() => go(steps[activeIndex - 1].id)}
              disabled={activeIndex === 0}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-garden-700 disabled:invisible"
            >
              ← {steps[activeIndex - 1]?.label}
            </button>
            <button
              type="button"
              onClick={() => go(steps[activeIndex + 1].id)}
              disabled={activeIndex === steps.length - 1}
              className="text-sm font-medium text-garden-700 transition-colors hover:text-garden-600 disabled:invisible"
            >
              {steps[activeIndex + 1]?.label} →
            </button>
          </div>
        </div>

        {/* Save bar — stays visible; fields from every step save together. */}
        <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-limestone-300 bg-white/95 px-5 py-4 shadow-card-hover backdrop-blur">
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" name="published" form={EDITOR_FORM_ID} defaultChecked={published} key={`pub-${formKey}`} />
            Published <span className="hidden text-ink-soft sm:inline">(visible on the public site)</span>
          </label>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-ink-soft md:block">
              {isNew ? "Lists (amenities, plans…) unlock after the first save." : "Saves the text, numbers and media of every section."}
            </p>
            <button
              type="submit"
              form={EDITOR_FORM_ID}
              disabled={isPending || uploading}
              className="rounded-lg bg-garden-500 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-garden-600 disabled:opacity-60"
            >
              {isPending ? "Saving…" : uploading ? "Waiting for uploads…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
