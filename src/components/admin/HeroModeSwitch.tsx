"use client";

import { setHeroMode } from "@/app/admin/(dashboard)/hero/actions";
import { useAdminAction } from "@/components/admin/AdminToaster";
import { cn } from "@/lib/utils";

type Mode = "image" | "video";

const OPTIONS: { mode: Mode; title: string; hint: string; icon: React.ReactNode }[] = [
  {
    mode: "image",
    title: "Image slider",
    hint: "Photos fade from one to the next every few seconds.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 16 5-5 4 4 3-3 6 6" />
        <circle cx="15.5" cy="9" r="1.5" />
      </svg>
    ),
  },
  {
    mode: "video",
    title: "Video slider",
    hint: "Videos play one after another, muted, behind the hero text.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="m17 10 4-2.5v9L17 14" />
      </svg>
    ),
  },
];

// Picks what the homepage hero shows. Saves on click.
export function HeroModeSwitch({
  mode,
  publishedImages,
  publishedVideos,
}: {
  mode: Mode;
  publishedImages: number;
  publishedVideos: number;
}) {
  const { run, isPending } = useAdminAction();

  return (
    <div className="rounded-xl border border-limestone-300 bg-white p-5 shadow-card">
      <h2 className="text-lg">What the homepage hero shows</h2>
      <div role="radiogroup" aria-label="Homepage hero" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = option.mode === mode;
          const count = option.mode === "image" ? publishedImages : publishedVideos;
          return (
            <button
              key={option.mode}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={isPending}
              onClick={() =>
                !selected && run(() => setHeroMode(option.mode), `Homepage now shows the ${option.title.toLowerCase()}.`)
              }
              className={cn(
                "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors disabled:opacity-60",
                selected ? "border-garden-500 bg-garden-50" : "border-limestone-300 hover:border-garden-300"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  selected ? "bg-garden-500 text-white" : "bg-limestone-200 text-ink-soft"
                )}
              >
                {option.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {option.title}
                  {selected && (
                    <span className="rounded-full bg-garden-500 px-2 py-0.5 text-[11px] font-medium text-white">On</span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-ink-soft">{option.hint}</span>
                <span className="mt-1 block text-xs text-ink-soft">
                  {count} published {option.mode === "image" ? "image" : "video"}
                  {count === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {mode === "video" && publishedVideos === 0 && (
        <p className="mt-3 rounded-lg bg-brass-50 px-3 py-2 text-xs text-brass-dark">
          No published video yet, so the homepage keeps showing the image slider. Add a video below.
        </p>
      )}
    </div>
  );
}
