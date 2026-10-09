"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { CoverImageUploadField } from "@/components/admin/CoverImageUploadField";
import { createProjectSectionItem, updateProjectSectionItem } from "@/app/admin/(dashboard)/projects/actions";
import { CONTENT_ICON_OPTIONS } from "@/lib/constants";
import { PROJECT_SECTIONS } from "@/lib/projectSections";
import type { ProjectItemSection, ProjectSectionItem } from "@/lib/types";
import { useActionFeedback } from "@/components/admin/AdminToaster";
import { cn } from "@/lib/utils";

function SubmitButton({ label, waiting }: { label: string; waiting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || waiting}>
      {pending ? "Saving…" : waiting ? "Waiting for upload…" : label}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";

export function ProjectSectionItemForm({
  projectId,
  section,
  item,
  onCancel,
  onSaved,
}: {
  projectId: string;
  section: ProjectItemSection;
  item?: ProjectSectionItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const config = PROJECT_SECTIONS[section];
  const action = item
    ? updateProjectSectionItem.bind(null, item.id)
    : createProjectSectionItem.bind(null, projectId, section);
  const [state, formAction] = useActionState(action, {});
  useActionFeedback(state, item ? `"${item.title}" saved.` : "Item added.");
  const [icon, setIcon] = useState(item?.icon ?? "home");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-garden-300 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-base text-ink">
          {item ? "Edit" : "Add"} · {config.label}
        </h3>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <Field label={config.titleLabel ?? "Title"} htmlFor={`${section}-title`} error={state.fieldErrors?.title}>
        <input
          id={`${section}-title`}
          name="title"
          className={inputClass}
          defaultValue={item?.title}
          placeholder={config.example}
          required
        />
      </Field>

      {config.description && (
        <Field label={`${config.descriptionLabel ?? "Description"} (optional)`} htmlFor={`${section}-description`} error={state.fieldErrors?.description}>
          <textarea
            id={`${section}-description`}
            name="description"
            rows={3}
            className={inputClass}
            defaultValue={item?.description}
          />
        </Field>
      )}

      {config.tabs && (
        <Field label="Tab" htmlFor={`${section}-tab`} error={state.fieldErrors?.tab}>
          <select
            id={`${section}-tab`}
            name="tab"
            defaultValue={item?.tab ?? config.tabs[0].value}
            className={inputClass}
          >
            {config.tabs.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {config.icon && (
        <Field label="Icon" htmlFor={`${section}-icon`} error={state.fieldErrors?.icon}>
          <input type="hidden" id={`${section}-icon`} name="icon" value={icon} />
          <div
            role="radiogroup"
            aria-label="Icon"
            className="grid grid-cols-6 gap-2 rounded-lg border border-limestone-300 bg-limestone-100 p-2.5 sm:grid-cols-10"
          >
            {CONTENT_ICON_OPTIONS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                title={key}
                onClick={() => setIcon(key)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border transition-colors duration-150",
                  icon === key
                    ? "border-garden-500 bg-garden-500 text-white shadow-sm"
                    : "border-transparent bg-white text-garden-700 hover:border-garden-300"
                )}
              >
                <ContentIcon icon={key} />
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-soft">Selected: {icon}</p>
        </Field>
      )}

      {config.image !== "none" && (
        <Field
          label={config.image === "required" ? "Image" : "Image (optional)"}
          htmlFor={`${section}-image`}
          error={state.fieldErrors?.imageUrl}
        >
          <CoverImageUploadField
            fieldName="imageUrl"
            subdir="projects"
            existingUrl={item?.imageUrl ?? undefined}
            required={config.image === "required" && !item}
            onUploadingChange={setUploading}
          />
        </Field>
      )}

      <SubmitButton label={item ? "Save Changes" : "Add Item"} waiting={uploading} />
    </form>
  );
}
