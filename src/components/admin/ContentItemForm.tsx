"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { createContentItem, updateContentItem } from "@/lib/admin/contentItemActions";
import { CONTENT_ICON_OPTIONS } from "@/lib/constants";
import type { ContentItem, ContentSection, ContentTone } from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
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

const toneOptions: { value: ContentTone; label: string }[] = [
  { value: "garden", label: "Green" },
  { value: "sky", label: "Blue" },
  { value: "brass", label: "Gold" },
];

// Shared create/edit form for every ContentItem-backed list — which
// fields actually matter on the public page (icon/description are
// ignored by e.g. the About page's mission-points list) varies, but
// showing all three consistently keeps this one form reusable across
// all five lists instead of five near-identical forms.
export function ContentItemForm({
  section,
  item,
  onCancel,
  onSaved,
}: {
  section: ContentSection;
  item?: ContentItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = item
    ? updateContentItem.bind(null, item.id, section)
    : createContentItem.bind(null, section);
  const [state, formAction] = useActionState(action, {});
  const [icon, setIcon] = useState(item?.icon ?? "home");
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-limestone-300 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-base text-ink">{item ? "Edit" : "Add"} Item</h3>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          className={inputClass}
          defaultValue={item?.title}
          placeholder="e.g. Land development"
          required
        />
      </Field>

      <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={inputClass}
          defaultValue={item?.description}
          placeholder="Leave blank if this list doesn't use a description."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Icon" htmlFor="icon" error={state.fieldErrors?.icon}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-garden-100 text-garden-700">
              <ContentIcon icon={icon} />
            </span>
            <select
              id="icon"
              name="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className={inputClass}
            >
              {CONTENT_ICON_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {key[0].toUpperCase() + key.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Color" htmlFor="tone" error={state.fieldErrors?.tone}>
          <select id="tone" name="tone" defaultValue={item?.tone ?? "garden"} className={inputClass}>
            {toneOptions.map((tone) => (
              <option key={tone.value} value={tone.value}>
                {tone.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <SubmitButton label={item ? "Save Changes" : "Add Item"} />
    </form>
  );
}
