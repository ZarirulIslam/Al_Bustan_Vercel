"use client";

import { useActionState } from "react";
import { submitPlotBooking } from "@/lib/actions/inquiries";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-limestone-300 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-garden-500 focus:ring-2 focus:ring-garden-100";

// "প্লট বুকিং" form on land project pages. Blocks come from the project
// (Admin → Booking step); with none set, block is typed in freely.
export function PlotBookingForm({
  projectId,
  projectName,
  blocks,
}: {
  projectId: string;
  projectName: string;
  blocks: string[];
}) {
  const [state, formAction, isPending] = useActionState(submitPlotBooking, {});

  if (state.success) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-garden-300 bg-garden-50 px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-garden-500 text-white">
          <svg width="24" height="24" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-5 text-xl font-semibold text-garden-700">ধন্যবাদ! আপনার বুকিং রিকোয়েস্ট আমরা পেয়েছি।</p>
        <p className="mt-2 text-ink-soft">আমাদের প্রতিনিধি অতি দ্রুত আপনার সাথে যোগাযোগ করবেন।</p>
      </div>
    );
  }

  const err = (field: keyof NonNullable<typeof state.fieldErrors>) =>
    state.fieldErrors?.[field] ? (
      <p className="mt-1 text-xs text-red-700">
        {state.fieldErrors[field] === "email" ? "সঠিক ইমেইল ঠিকানা দিন।" : "এই তথ্যটি প্রয়োজন।"}
      </p>
    ) : null;

  const field = (
    name: "name" | "address" | "road" | "phone" | "plotNo" | "email" | "size",
    label: string,
    placeholder: string,
    opts: { required?: boolean; type?: string; autoComplete?: string } = {}
  ) => (
    <div>
      <label htmlFor={`booking-${name}`} className="text-sm font-medium text-ink">
        {label}
        {opts.required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={`booking-${name}`}
        name={name}
        type={opts.type ?? "text"}
        required={opts.required}
        autoComplete={opts.autoComplete}
        placeholder={placeholder}
        className={inputClass}
      />
      {err(name)}
    </div>
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="projectName" value={projectName} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("name", "নাম", "সম্পূর্ণ নাম", { required: true, autoComplete: "name" })}
        <div>
          <label htmlFor="booking-block" className="text-sm font-medium text-ink">
            ব্লক<span className="text-red-600">*</span>
          </label>
          {blocks.length > 0 ? (
            <select id="booking-block" name="block" required defaultValue="" className={cn(inputClass, "appearance-auto")}>
              <option value="" disabled>
                ব্লক নির্বাচন করুন
              </option>
              {blocks.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
          ) : (
            <input id="booking-block" name="block" required placeholder="পছন্দের ব্লক" className={inputClass} />
          )}
          {err("block")}
        </div>
        {field("address", "ঠিকানা", "বর্তমান ঠিকানা", { required: true, autoComplete: "street-address" })}
        {field("road", "রোড / রাস্তা", "রাস্তা / এলাকা")}
        {field("phone", "ফোন নম্বর", "আপনার ফোন নম্বর", { required: true, type: "tel", autoComplete: "tel" })}
        {field("plotNo", "প্লট নং", "পছন্দের প্লট নং")}
        {field("email", "ইমেইল", "আপনার ইমেইল", { required: true, type: "email", autoComplete: "email" })}
        {field("size", "আয়তন (কাঠা)", "প্রয়োজনীয় সাইজ", { required: true })}
      </div>

      {state.error && <p className="text-sm text-red-700">কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-garden-500 px-6 py-3.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-garden-600 disabled:opacity-60"
      >
        {isPending ? "পাঠানো হচ্ছে…" : "বুকিং জমা দিন"}
      </button>
    </form>
  );
}
