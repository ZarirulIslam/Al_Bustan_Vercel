"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL = "__all";
const STANDALONE = "__more";

// A mosaic rhythm: every 6th photo is a big 2×2 tile, every 6th+3 a
// wide one, the rest square-ish — so the grid never reads as a plain
// spreadsheet of thumbnails. grid-flow-dense fills the gaps.
function tileClass(index: number) {
  if (index % 6 === 0) return "col-span-2 row-span-2";
  if (index % 6 === 3) return "col-span-2";
  return "";
}

// Gallery page: project filter chips, a mosaic of photos and a
// full-screen viewer (arrows, keyboard ← → Esc, swipe on phones).
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState(ALL);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filters = useMemo(() => {
    const projects = new Map<string, { name: string; count: number }>();
    let standalone = 0;
    for (const item of items) {
      if (item.source === "project" && item.projectSlug) {
        const entry = projects.get(item.projectSlug) ?? { name: item.projectName ?? item.projectSlug, count: 0 };
        entry.count++;
        projects.set(item.projectSlug, entry);
      } else standalone++;
    }
    return [
      { key: ALL, label: "All photos", count: items.length },
      ...[...projects.entries()].map(([slug, p]) => ({ key: slug, label: p.name, count: p.count })),
      ...(standalone > 0 && projects.size > 0 ? [{ key: STANDALONE, label: "More photos", count: standalone }] : []),
    ];
  }, [items]);

  const shown = useMemo(
    () =>
      filter === ALL
        ? items
        : filter === STANDALONE
          ? items.filter((i) => i.source !== "project")
          : items.filter((i) => i.projectSlug === filter),
    [items, filter]
  );

  if (items.length === 0) return null;

  return (
    <>
      {filters.length > 2 && (
        <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-1">
          <div role="tablist" aria-label="Filter photos" className="flex w-max gap-2">
            {filters.map((f) => {
              const selected = f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-estate",
                    selected
                      ? "border-garden-700 bg-garden-700 text-white"
                      : "border-limestone-300 bg-white text-ink hover:border-garden-500 hover:text-garden-700"
                  )}
                >
                  {f.label}
                  <span className={cn("ml-2 text-xs", selected ? "text-white/70" : "text-ink-soft")}>{f.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        key={filter}
        className="grid grid-flow-dense auto-rows-[9.5rem] grid-cols-2 gap-2.5 sm:auto-rows-[12rem] sm:gap-3 md:grid-cols-3 lg:auto-rows-[14rem] lg:grid-cols-4 lg:gap-4"
      >
        {shown.map((item, i) => {
          const label = item.projectName ?? item.caption ?? null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-limestone-200 shadow-sm ring-1 ring-ink/5 transition-shadow duration-300 ease-estate hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-garden-500",
                tileClass(i)
              )}
              aria-label={label ? `Open photo: ${label}` : "Open photo"}
            >
              <Image
                src={item.url}
                alt={item.alt}
                fill
                sizes={tileClass(i).includes("col-span-2") ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"}
                className="object-cover transition-transform duration-700 ease-estate group-hover:scale-[1.06]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-garden-900/75 via-garden-900/0 to-transparent opacity-90 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />
              {label && (
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-left transition-all duration-300 md:translate-y-2 md:p-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                  <span className="line-clamp-2 text-xs font-medium text-white sm:text-sm">{label}</span>
                  <span
                    aria-hidden="true"
                    className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm sm:flex"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeIndex !== null && shown[activeIndex] && (
        <Lightbox items={shown} index={activeIndex} onIndex={setActiveIndex} onClose={() => setActiveIndex(null)} />
      )}
    </>
  );
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: GalleryItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const many = items.length > 1;
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = useCallback((step: number) => onIndex((index + step + items.length) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && many) go(1);
      else if (e.key === "ArrowLeft" && many) go(-1);
    };
    document.addEventListener("keydown", onKey);
    // Keep the page behind from scrolling while the viewer is open.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, many, onClose]);

  const arrow =
    "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:flex";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-garden-900/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || !many) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80 sm:px-6 sm:py-4" onClick={(e) => e.stopPropagation()}>
        <span className="tabular-nums">
          {index + 1} / {items.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-3 sm:px-20">
        {many && (
          <button type="button" aria-label="Previous photo" onClick={(e) => (e.stopPropagation(), go(-1))} className={cn(arrow, "left-4")}>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
              <path d="M8.5 1 1.5 8l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
          <Image key={item.id} src={item.url} alt={item.alt} fill sizes="100vw" className="animate-[fadeIn_0.3s_ease] object-contain" priority />
        </div>
        {many && (
          <button type="button" aria-label="Next photo" onClick={(e) => (e.stopPropagation(), go(1))} className={cn(arrow, "right-4")}>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
              <path d="M1.5 1l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="px-4 pb-5 pt-4 text-center sm:pb-7" onClick={(e) => e.stopPropagation()}>
        {item.projectName ? (
          <Link
            href={`/projects/${item.projectSlug}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            {item.projectName}
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          item.caption && <p className="text-sm text-white/85">{item.caption}</p>
        )}
        {many && <p className="mt-3 text-xs text-white/50 sm:hidden">Swipe to see more</p>}
      </div>
    </div>
  );
}
