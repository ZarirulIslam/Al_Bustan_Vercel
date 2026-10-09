"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

// Hero of the /projects page: one slide per published project (up to
// six) — its cover photo, type, name and short introduction — with an
// "Explore projects" button and ← 01 / 06 → controls. Auto-advances,
// pausing on hover and for visitors who prefer reduced motion.
export function ProjectsHeroSlider({ projects, companyName }: { projects: Project[]; companyName: string }) {
  const slides = projects.filter((p) => p.coverImage.url).slice(0, 6);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-garden-900 md:min-h-[660px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured projects"
    >
      {slides.map((project, i) => (
        <Image
          key={project.id}
          src={project.coverImage.url}
          alt={i === index ? project.coverImage.alt || project.name : ""}
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            "-z-20 object-cover transition-all duration-[1400ms] ease-estate",
            i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
          )}
        />
      ))}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-garden-900/90 via-garden-900/55 to-transparent" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-garden-900/80 via-transparent to-black/20" />

      <div className="container-content w-full pb-14 pt-24 md:pb-20">
        <p className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.28em] text-white/85">
          <span aria-hidden className="h-px w-12 bg-garden-300" />
          {companyName} · Signature Collection
        </p>

        {slides.map((project, i) => (
          <div key={project.id} hidden={i !== index} aria-live="polite">
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-garden-300">
              {project.category === "flat" ? "Apartment Project" : "Land Project"}
            </p>
            <h1 className="mt-4 max-w-3xl font-body text-5xl font-bold leading-[1.02] tracking-tight text-white md:text-7xl">
              {project.name}
            </h1>
            <p className="mt-6 line-clamp-2 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{project.shortDescription}</p>
          </div>
        ))}

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full bg-garden-500 px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-card transition-colors hover:bg-garden-600"
          >
            Explore projects
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <Link
            href={`/projects/${slides[index].slug}`}
            className="rounded-full px-4 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            View project
          </Link>
          {count > 1 && (
            <div className="flex items-center rounded-full border border-white/25 bg-black/20 backdrop-blur">
              <button type="button" onClick={() => go(-1)} aria-label="Previous project" className="px-5 py-3.5 text-white/80 transition-colors hover:text-white">
                ←
              </button>
              <span className="border-x border-white/20 px-4 text-xs font-bold tabular-nums tracking-[0.2em] text-white/80">
                {pad(index + 1)} / {pad(count)}
              </span>
              <button type="button" onClick={() => go(1)} aria-label="Next project" className="px-5 py-3.5 text-white/80 transition-colors hover:text-white">
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
