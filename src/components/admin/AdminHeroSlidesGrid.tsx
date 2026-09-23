"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import type { HeroSlide } from "@prisma/client";
import {
  deleteHeroSlide,
  moveHeroSlide,
  replaceHeroSlide,
  toggleHeroSlidePublished,
} from "@/app/admin/(dashboard)/hero/actions";
import { uploadImageClientSide, ClientUploadError } from "@/lib/uploadClient";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

function HeroSlideCard({
  slide,
  index,
  total,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = isPending || replacing;

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setReplacing(true);
    try {
      const url = await uploadImageClientSide(file, "hero");
      startTransition(() => {
        replaceHeroSlide(slide.id, url);
      });
    } catch (err) {
      setError(err instanceof ClientUploadError ? err.message : "Upload failed.");
    } finally {
      setReplacing(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card transition-shadow duration-300 ease-estate hover:shadow-card-hover">
      <div className="relative aspect-video">
        <Image
          src={slide.url}
          alt={slide.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium text-white">
          {index + 1}
        </span>
        {replacing && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
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
              startTransition(() => toggleHeroSlidePublished(slide.id, !slide.published))
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
                startTransition(() => deleteHeroSlide(slide.id));
              }
            }}
          >
            Delete
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={busy || index === 0}
            onClick={() => startTransition(() => moveHeroSlide(slide.id, "up"))}
            className="flex-1 rounded-lg border border-limestone-300 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-limestone-300 disabled:hover:text-ink-soft"
          >
            ↑ Move up
          </button>
          <button
            type="button"
            disabled={busy || index === total - 1}
            onClick={() => startTransition(() => moveHeroSlide(slide.id, "down"))}
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {slides.map((slide, index) => (
        <HeroSlideCard key={slide.id} slide={slide} index={index} total={slides.length} />
      ))}
    </div>
  );
}
