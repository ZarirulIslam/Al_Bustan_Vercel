"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProjectImage } from "@/lib/types";

export function ImageGallery({ images }: { images: ProjectImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg"
            aria-label={`Open image ${i + 1} of ${images.length}`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 ease-estate group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-6"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="Close"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M1 1L17 17M17 1L1 17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div
            className="relative aspect-[4/3] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.url}
              alt={active.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
