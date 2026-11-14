"use client";

import { cn } from "@/lib/utils";
import { IMAGE_FOCUS_OPTIONS, type ImageFit, type ImageFocus } from "@/lib/imageDisplay";

// Per-slide display settings in admin: which part of the image stays
// visible when it's cropped, and whether to show the whole image.
export function ImageDisplayControls({
  focus,
  fit,
  disabled,
  onChange,
}: {
  focus: ImageFocus;
  fit: ImageFit;
  disabled?: boolean;
  onChange: (next: { focus: ImageFocus; fit: ImageFit }) => void;
}) {
  const whole = fit === "contain";

  return (
    <div className="space-y-2 rounded-lg border border-limestone-200 bg-limestone-100 p-2.5">
      <label className="flex cursor-pointer items-center justify-between gap-2 text-xs font-medium text-ink">
        <span>
          Show whole image
          <span className="block font-normal text-ink-soft">No cropping — good for banners with text or maps</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={whole}
          disabled={disabled}
          onClick={() => onChange({ focus, fit: whole ? "cover" : "contain" })}
          className={cn(
            "relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-150 disabled:opacity-40",
            whole ? "bg-garden-600" : "bg-limestone-300"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-150",
              whole ? "left-[18px]" : "left-0.5"
            )}
          />
        </button>
      </label>

      <div className={cn(whole && "opacity-40")}>
        <p className="text-xs font-medium text-ink">
          Keep visible when cropped
          {whole && <span className="font-normal text-ink-soft"> (not used while the whole image shows)</span>}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1" role="radiogroup" aria-label="Focus point">
          {IMAGE_FOCUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={focus === option.value}
              disabled={disabled || whole}
              onClick={() => onChange({ focus: option.value, fit })}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors duration-150 disabled:cursor-not-allowed",
                focus === option.value
                  ? "border-garden-600 bg-garden-600 text-white"
                  : "border-limestone-300 bg-white text-ink-soft hover:border-garden-300 hover:text-garden-700"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecommendedSize({ size, tip }: { size: string; tip: string }) {
  return (
    <div className="rounded-lg border border-sky/20 bg-sky-50 px-3.5 py-2.5 text-xs text-ink">
      <p>
        <span className="font-semibold">Recommended size:</span> {size}
      </p>
      <p className="mt-0.5 text-ink-soft">{tip}</p>
      <p className="mt-0.5 text-ink-soft">After adding, you can adjust how each image is framed on its card below.</p>
    </div>
  );
}
