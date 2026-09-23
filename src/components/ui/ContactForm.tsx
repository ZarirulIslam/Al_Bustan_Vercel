"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { submitInquiry } from "@/lib/actions/inquiries";
import { inquiryTypeOptions } from "@/lib/inquirySchema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center sm:w-auto">
      {pending ? "Sending…" : "Send Message"}
    </Button>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-limestone-300 bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-garden-500";

export function ContactForm() {
  const [state, formAction] = useActionState(submitInquiry, {});

  if (state.success) {
    return (
      <div className="rounded-lg border border-garden-300 bg-garden-50 p-6">
        <p className="text-base text-garden-700">
          Thank you. Your message has been received and our team will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="text-sm text-ink">
          Name
        </label>
        <input id="contact-name" name="name" type="text" required className={inputClass} />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-xs text-red-700">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="text-sm text-ink">
            Phone
          </label>
          <input id="contact-phone" name="phone" type="tel" required className={inputClass} />
          {state.fieldErrors?.phone && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.phone}</p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm text-ink">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required className={inputClass} />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="text-sm text-ink">
          Subject
        </label>
        <input id="contact-subject" name="subject" type="text" required className={inputClass} />
        {state.fieldErrors?.subject && (
          <p className="mt-1 text-xs text-red-700">{state.fieldErrors.subject}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact-inquiryType" className="text-sm text-ink">
          Inquiry Type
        </label>
        <select
          id="contact-inquiryType"
          name="inquiryType"
          defaultValue="general"
          className={inputClass}
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
        <label htmlFor="contact-message" className="text-sm text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          className={`${inputClass} resize-none`}
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
