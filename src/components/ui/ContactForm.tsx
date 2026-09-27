"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { submitInquiry } from "@/lib/actions/inquiries";
import { inquiryTypeOptions } from "@/lib/inquirySchema";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="accent"
      disabled={pending}
      className="h-12 w-full text-xs font-semibold uppercase tracking-[0.2em]"
    >
      {pending ? "Sending…" : "Send Message"}
      {!pending && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Button>
  );
}

// Underline-style fields: a quiet hairline that turns deep green on
// focus (red when invalid), with small tracked uppercase labels above.
const fieldClass =
  "peer w-full border-0 border-b border-limestone-300 bg-transparent px-0 py-2.5 text-base text-ink placeholder:text-ink-soft/45 outline-none transition-colors duration-200 focus:border-garden-500 focus:shadow-[0_1px_0_0_theme(colors.garden.500)] focus-visible:outline-none aria-[invalid=true]:border-red-600";

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitInquiry, {});
  const errors = state.fieldErrors;
  const a11y = (id: string, error?: string) =>
    error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

  if (state.success) {
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-garden-50 text-garden-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="mt-5 text-2xl">Thank you</h3>
        <p className="mt-2 max-w-sm text-base text-ink-soft">
          Your message has been received and our team will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
      <Field id="contact-name" label="Your Name" error={errors?.name}>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Full name"
          required
          className={fieldClass}
          {...a11y("contact-name", errors?.name)}
        />
      </Field>

      <Field id="contact-phone" label="Phone" error={errors?.phone}>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Your number"
          required
          className={fieldClass}
          {...a11y("contact-phone", errors?.phone)}
        />
      </Field>

      <Field id="contact-email" label="Email" error={errors?.email}>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          required
          className={fieldClass}
          {...a11y("contact-email", errors?.email)}
        />
      </Field>

      <Field id="contact-inquiryType" label="Inquiry Type" error={errors?.inquiryType}>
        <div className="relative">
          <select
            id="contact-inquiryType"
            name="inquiryType"
            defaultValue="general"
            className={cn(fieldClass, "cursor-pointer appearance-none pr-8")}
            {...a11y("contact-inquiryType", errors?.inquiryType)}
          >
            {inquiryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-ink-soft"
          >
            <path d="M3 5.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Field>

      <Field id="contact-subject" label="Subject" error={errors?.subject} className="sm:col-span-2">
        <input
          id="contact-subject"
          name="subject"
          type="text"
          placeholder="What is this about?"
          required
          className={fieldClass}
          {...a11y("contact-subject", errors?.subject)}
        />
      </Field>

      <Field id="contact-message" label="Message" error={errors?.message} className="sm:col-span-2">
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          placeholder="Project of interest, preferred unit size, budget, best time to call…"
          required
          className={cn(fieldClass, "resize-none")}
          {...a11y("contact-message", errors?.message)}
        />
      </Field>

      <div className="sm:col-span-2">
        {state.error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton />
        <p className="mt-4 text-center text-xs text-ink-soft/80">
          We usually reply within one working day.
        </p>
      </div>
    </form>
  );
}
