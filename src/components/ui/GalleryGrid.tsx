"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { GalleryItem } from "@/lib/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const active = activeIndex !== null ? items[activeIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 ease-estate hover:shadow-lg"
            aria-label={item.projectName ? `Open photo from ${item.projectName}` : "Open photo"}
          >
            <Image
              src={item.url}
              alt={item.alt}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 ease-estate group-hover:scale-105"
            />
            {item.projectName && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-5 pb-4 pt-12 text-left text-sm font-medium text-white opacity-0 transition-opacity duration-200 ease-estate group-hover:opacity-100">
                {item.projectName}
              </span>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
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
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex max-w-3xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[4/3] w-full">
              <Image src={active.url} alt={active.alt} fill sizes="100vw" className="object-contain" />
            </div>
            {(active.projectName || active.caption) && (
              <div className="mt-4 text-center text-sm text-white/90">
                {active.projectName ? (
                  <Link href={`/projects/${active.projectSlug}`} className="underline hover:no-underline">
                    View {active.projectName}
                  </Link>
                ) : (
                  active.caption
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
