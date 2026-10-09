"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ProjectImage } from "@/lib/types";
import { ALL_GALLERY_CATEGORIES } from "@/lib/projectSections";
import { SHARED_COPY, type ProjectLocale } from "@/lib/projectCopy";

// Photo grid with a full-screen viewer (arrow keys / Esc supported).
// The first image can be featured at double size for a magazine-style
// layout on wide screens. When images carry gallery categories, filter
// tabs ("All" + each category in use) appear above the grid.
export function ImageGallery({
  images: allImages,
  featureFirst = false,
  square = false,
  showCategories = true,
  locale = "en",
}: {
  images: ProjectImage[];
  featureFirst?: boolean;
  // Square tiles (apartment gallery) instead of 4:3.
  square?: boolean;
  showCategories?: boolean;
  locale?: ProjectLocale;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const usedCategories = ALL_GALLERY_CATEGORIES.filter((c) => allImages.some((img) => img.category === c.value));
  const showTabs =
    showCategories &&
    (usedCategories.length > 1 || (usedCategories.length === 1 && allImages.some((img) => !img.category)));
  const images = filter ? allImages.filter((img) => img.category === filter) : allImages;
  const count = images.length;

  const step = useCallback(
    (delta: number) => setActiveIndex((i) => (i === null ? i : (i + delta + count) % count)),
    [count]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, step]);

  if (allImages.length === 0) return null;

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      {showTabs && (
        <div role="tablist" aria-label="Gallery categories" className="mb-8 flex flex-wrap justify-center gap-2">
          {[{ value: null, label: SHARED_COPY[locale].gallery.all }, ...usedCategories.map((c) => ({ value: c.value as string | null, label: c[locale] }))].map(
            (tab) => (
              <button
                key={tab.value ?? "all"}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                onClick={() => {
                  setFilter(tab.value);
                  setActiveIndex(null);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  filter === tab.value
                    ? "border-garden-500 bg-garden-500 text-white shadow-card"
                    : "border-limestone-300 bg-white text-ink-soft hover:border-garden-300 hover:text-garden-700"
                }`}
              >
                {tab.label}
              </button>
            )
          )}
        </div>
      )}
      <div className={`grid gap-3 sm:gap-4 ${gridColumns(count)}`}>
        {images.map((image, i) => {
          const featured = featureFirst && i === 0 && count > 4;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`group relative overflow-hidden rounded-xl bg-limestone-200 shadow-card ${
                featured ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : square ? "aspect-square" : "aspect-[4/3]"
              }`}
              aria-label={`Open image ${i + 1} of ${count}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"}
                className="object-cover transition-transform duration-500 ease-estate group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-garden-900/0 transition-colors duration-300 group-hover:bg-garden-900/30">
                <span className="flex h-11 w-11 scale-75 items-center justify-center rounded-full bg-white/90 text-garden-700 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {active && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-garden-900/95 p-4 sm:p-10"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          {count > 1 && (
            <>
              <ViewerArrow direction="prev" onClick={() => step(-1)} />
              <ViewerArrow direction="next" onClick={() => step(1)} />
            </>
          )}

          <div className="relative h-full max-h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={active.url} alt={active.alt} fill sizes="100vw" className="object-contain" />
          </div>

          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1 text-xs tracking-wider text-white/80">
            {activeIndex + 1} / {count}
          </p>
        </div>
      )}
    </>
  );
}

// Fewer than four photos fill the row instead of leaving empty columns.
function gridColumns(count: number) {
  if (count === 1) return "grid-cols-1 max-w-3xl mx-auto";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2 md:grid-cols-3";
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
}

function ViewerArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={direction === "prev" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 ${
        direction === "prev" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={direction === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
