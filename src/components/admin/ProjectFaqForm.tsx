"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createProjectFaq, updateProjectFaq } from "@/app/admin/(dashboard)/projects/actions";
import type { ProjectFaq } from "@/lib/types";

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

export function ProjectFaqForm({
  projectId,
  faq,
  onCancel,
  onSaved,
}: {
  projectId: string;
  faq?: ProjectFaq;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = faq ? updateProjectFaq.bind(null, faq.id) : createProjectFaq.bind(null, projectId);
  const [state, formAction] = useActionState(action, {});
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
        <h3 className="text-base text-ink">{faq ? "Edit" : "Add"} FAQ</h3>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <Field label="Question" htmlFor="question" error={state.fieldErrors?.question}>
        <input
          id="question"
          name="question"
          className={inputClass}
          defaultValue={faq?.question}
          placeholder="e.g. What documents are required for booking?"
          required
        />
      </Field>

      <Field label="Answer" htmlFor="answer" error={state.fieldErrors?.answer}>
        <textarea
          id="answer"
          name="answer"
          rows={4}
          className={inputClass}
          defaultValue={faq?.answer}
          required
        />
      </Field>

      <SubmitButton label={faq ? "Save Changes" : "Add FAQ"} />
    </form>
  );
}
