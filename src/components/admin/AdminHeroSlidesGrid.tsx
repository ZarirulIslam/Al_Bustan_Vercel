"use client";

import { useRef, useState } from "react";
import { FramedImage } from "@/components/ui/FramedImage";
import { ImageDisplayControls } from "@/components/admin/ImageDisplayControls";
import type { ImageFit, ImageFocus } from "@/lib/imageDisplay";
import type { HeroSlide } from "@prisma/client";
import {
  deleteHeroSlide,
  moveHeroSlide,
  replaceHeroSlide,
  setHeroSlideDisplay,
  toggleHeroSlidePublished,
} from "@/app/admin/(dashboard)/hero/actions";
import { uploadImageClientSide, ClientUploadError } from "@/lib/uploadClient";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminAction } from "@/components/admin/AdminToaster";

function HeroSlideCard({
  slide,
  index,
  total,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
}) {
  const { run, isPending } = useAdminAction();
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = isPending || replacing;
  // Shown immediately in the previews; saved in the background.
  const [display, setDisplay] = useState<{ focus: ImageFocus; fit: ImageFit }>({ focus: slide.focus, fit: slide.fit });

  function changeDisplay(next: { focus: ImageFocus; fit: ImageFit }) {
    setDisplay(next);
    run(() => setHeroSlideDisplay(slide.id, next), "Framing saved.");
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setReplacing(true);
    try {
      const url = await uploadImageClientSide(file, "hero");
      run(() => replaceHeroSlide(slide.id, url), "Slide image replaced.");
    } catch (err) {
      setError(err instanceof ClientUploadError ? err.message : "Upload failed.");
    } finally {
      setReplacing(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card transition-shadow duration-300 ease-estate hover:shadow-card-hover">
      {/* The hero's real shapes: wide on computers, nearly square on phones. */}
      <div className="relative flex items-end gap-1.5 bg-ink p-2">
        <PreviewFrame label="Computer" aspect="aspect-[12/5]" grow="flex-[240]">
          <FramedImage src={slide.url} alt={slide.alt} fit={display.fit} focus={display.focus} sizes="300px" />
        </PreviewFrame>
        <PreviewFrame label="Phone" aspect="aspect-[39/46]" grow="flex-[85]">
          <FramedImage src={slide.url} alt="" fit={display.fit} focus={display.focus} sizes="120px" />
        </PreviewFrame>
        <span className="absolute left-3 top-3 z-10 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium text-white">
          {index + 1}
        </span>
        {replacing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/50">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() => toggleHeroSlidePublished(slide.id, !slide.published), slide.published ? "Slide unpublished." : "Slide published.")
            }
            className={
              slide.published
                ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${slide.published ? "bg-garden-500" : "bg-ink-soft/50"}`}
            />
            {slide.published ? "Published" : "Hidden"}
          </button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (confirm("Delete this slide? This can't be undone.")) {
                run(() => deleteHeroSlide(slide.id), "Slide deleted.");
              }
            }}
          >
            Delete
          </Button>
        </div>

        <div className="mt-2">
          <ImageDisplayControls focus={display.focus} fit={display.fit} disabled={busy} onChange={changeDisplay} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={busy || index === 0}
            onClick={() => run(() => moveHeroSlide(slide.id, "up"))}
            className="flex-1 rounded-lg border border-limestone-300 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-limestone-300 disabled:hover:text-ink-soft"
          >
            ↑ Move up
          </button>
          <button
            type="button"
            disabled={busy || index === total - 1}
            onClick={() => run(() => moveHeroSlide(slide.id, "down"))}
            className="flex-1 rounded-lg border border-limestone-300 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-limestone-300 disabled:hover:text-ink-soft"
          >
            ↓ Move down
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 w-full rounded-lg border border-limestone-300 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {replacing ? "Uploading…" : "⟲ Replace image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleReplace}
          className="hidden"
        />
        {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
      </div>
    </div>
  );
}

function PreviewFrame({
  label,
  aspect,
  grow,
  children,
}: {
  label: string;
  aspect: string;
  grow: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${grow}`}>
      <div className={`relative overflow-hidden rounded bg-garden-900 ${aspect}`}>{children}</div>
      <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-white/60">{label}</p>
    </div>
  );
}

export function AdminHeroSlidesGrid({ slides }: { slides: HeroSlide[] }) {
  if (slides.length === 0) {
    return (
      <EmptyState
        title="No slides yet"
        description="Add some above. Until then, the homepage hero shows its default background image."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {slides.map((slide, index) => (
        <HeroSlideCard key={slide.id} slide={slide} index={index} total={slides.length} />
      ))}
    </div>
  );
}
