"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProjectImage } from "@/lib/types";
import { cn } from "@/lib/utils";

// Cross-fading image carousel with arrows, dots/counter and optional
// thumbnails. Auto-advances (paused on hover/focus and when the user
// prefers reduced motion) when `autoPlay` is set.
export function ImageCarousel({
  images,
  aspect = "aspect-[4/5]",
  thumbnails = false,
  autoPlay = false,
  label,
  className,
}: {
  images: ProjectImage[];
  aspect?: string;
  thumbnails?: boolean;
  autoPlay?: boolean;
  label?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  useEffect(() => {
    if (!autoPlay || paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => window.clearInterval(timer);
  }, [autoPlay, paused, count]);

  if (count === 0) return null;

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <div className={className}>
      <div
        className={cn("group relative overflow-hidden rounded-3xl bg-limestone-200 shadow-card-hover", aspect)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-roledescription="carousel"
        aria-label={label}
      >
        {images.map((image, i) => (
          <Image
            key={image.id}
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority={i === 0}
            className={cn(
              "object-cover transition-opacity duration-700 ease-estate",
              i === index ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={i !== index}
          />
        ))}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-garden-900/60 to-transparent" />

        {label && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-garden-900/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brass-light" />
            {label}
          </span>
        )}

        {count > 1 && (
          <>
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {images.map((image, i) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={i === index}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                    )}
                  />
                ))}
              </div>
              <span className="rounded-full bg-garden-900/50 px-2.5 py-0.5 text-xs tabular-nums text-white backdrop-blur">
                {index + 1} / {count}
              </span>
            </div>
            <CarouselArrow side="left" onClick={() => go(-1)} />
            <CarouselArrow side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {thumbnails && count > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={cn(
                "relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200",
                i === index ? "ring-2 ring-garden-500 ring-offset-2" : "opacity-60 hover:opacity-100"
              )}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-garden-700 shadow-card transition-all duration-200 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        side === "left" ? "left-4" : "right-4"
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
