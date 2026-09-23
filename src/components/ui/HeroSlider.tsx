"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface HeroSlideImage {
  id: string;
  url: string;
  alt: string;
}

const AUTO_SLIDE_MS = 6000;

// Renders only the rotating background images, gradient overlay and
// controls for the homepage hero — the headline, description and CTA
// buttons stay static in src/app/(site)/page.tsx and render on top of
// this (see the `relative z-30` wrapper there). Falls back to a
// single default image so the hero looks the same as before until an
// admin publishes slides from /admin/hero.
export function HeroSlider({ images }: { images: HeroSlideImage[] }) {
  const slides =
    images.length > 0
      ? images
      : [
          {
            id: "default",
            url: "https://images.unsplash.com/photo-1748324687716-022bec19fe9b?auto=format&fit=crop&w=2400&q=80",
            alt: "Planned residential community exterior",
          },
        ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length, active]);

  function goTo(index: number) {
    setActive(((index % slides.length) + slides.length) % slides.length);
  }

  return (
    <>
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-estate ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={index !== active}
          >
            <Image
              src={slide.url}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, rgba(8,31,20,0.88) 0%, rgba(8,31,20,0.52) 45%, rgba(8,31,20,0.18) 75%)",
        }}
      />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(active - 1)}
            className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors duration-200 ease-estate hover:bg-white/35 md:left-6 md:h-11 md:w-11"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
              <path d="M8.5 1 1.5 8l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(active + 1)}
            className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors duration-200 ease-estate hover:bg-white/35 md:right-6 md:h-11 md:w-11"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
              <path d="M1.5 1l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-200 ease-estate ${
                  index === active ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
