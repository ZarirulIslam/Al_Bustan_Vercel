"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { submitInquiry } from "@/lib/actions/inquiries";
import { inquiryTypeOptions } from "@/lib/inquirySchema";

interface InquiryFormProps {
  projectId?: string;
  projectName?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send Inquiry"}
    </Button>
  );
}

export function InquiryForm({ projectId, projectName }: InquiryFormProps) {
  const [state, formAction] = useActionState(submitInquiry, {});

  if (state.success) {
    return (
      <div className="rounded-lg border border-garden-300 bg-garden-50 p-6">
        <p className="text-base text-garden-700">Thank you — your inquiry has been received.</p>
        <p className="mt-1 text-sm text-ink-soft">
          Our team will follow up using the details you provided.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {projectName && <input type="hidden" name="projectName" value={projectName} />}
      <input
        type="hidden"
        name="subject"
        value={projectName ? `Project inquiry: ${projectName}` : "Project inquiry"}
      />

      <div>
        <label htmlFor="inquiry-name" className="text-sm text-ink">
          Name
        </label>
        <input
          id="inquiry-name"
          name="name"
          type="text"
          required
          className="mt-1.5 w-full rounded-lg border border-limestone-300 bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-garden-500"
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-xs text-red-700">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inquiry-phone" className="text-sm text-ink">
            Phone
          </label>
          <input
            id="inquiry-phone"
            name="phone"
            type="tel"
            required
            className="mt-1.5 w-full rounded-lg border border-limestone-300 bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-garden-500"
          />
          {state.fieldErrors?.phone && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.phone}</p>
          )}
        </div>
        <div>
          <label htmlFor="inquiry-email" className="text-sm text-ink">
            Email
          </label>
          <input
            id="inquiry-email"
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-lg border border-limestone-300 bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-garden-500"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="inquiry-inquiryType" className="text-sm text-ink">
          Inquiry Type
        </label>
        <select
          id="inquiry-inquiryType"
          name="inquiryType"
          defaultValue="buying"
          className="mt-1.5 w-full rounded-lg border border-limestone-300 bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-garden-500"
        >
          {inquiryTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.inquiryType && (
          <p className="mt-1 text-xs text-red-700">{state.fieldErrors.inquiryType}</p>
        )}
      </div>

      <div>
        <label htmlFor="inquiry-message" className="text-sm text-ink">
          Message
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          rows={4}
          required
          placeholder={
            projectName
              ? `I'd like more information about ${projectName}.`
              : undefined
          }
          className="mt-1.5 w-full resize-none rounded-lg border border-limestone-300 bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-garden-500"
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-xs text-red-700">{state.fieldErrors.message}</p>
        )}
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
