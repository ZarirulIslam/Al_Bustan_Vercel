"use client";

import { useEffect, useRef, useState } from "react";

export interface HeroSlideVideo {
  id: string;
  url: string;
  posterUrl: string | null;
}

// Video version of the homepage hero background (HeroSlider shows the
// image version; /admin/hero picks which one). Videos play one after
// another, muted and inline so phones autoplay them; a single video
// loops. Only the active video downloads beyond its first frame. The
// headline and buttons render on top from src/app/(site)/page.tsx.
export function HeroVideoSlider({ videos }: { videos: HeroSlideVideo[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const single = videos.length === 1;

  // Respect "reduce motion": start paused, the visitor can press play.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  // Play the active video from the start; pause the rest.
  useEffect(() => {
    refs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active && !paused) {
        if (video.ended) video.currentTime = 0;
        video.play().catch(() => {
          // Autoplay refused (e.g. data saver) — show the play button.
          setPaused(true);
        });
      } else {
        video.pause();
        if (index !== active) video.currentTime = 0;
      }
    });
  }, [active, paused]);

  function goTo(index: number) {
    setActive(((index % videos.length) + videos.length) % videos.length);
  }

  return (
    <>
      <div className="absolute inset-0 z-0 bg-garden-900">
        {videos.map((video, index) => (
          <video
            key={video.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            src={video.url}
            poster={video.posterUrl ?? undefined}
            muted
            playsInline
            loop={single}
            preload={index === active ? "auto" : "metadata"}
            onEnded={() => goTo(active + 1)}
            aria-hidden="true"
            tabIndex={-1}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-estate ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(0deg, rgba(8,31,20,0.88) 0%, rgba(8,31,20,0.52) 45%, rgba(8,31,20,0.18) 75%)",
        }}
      />

      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 md:bottom-6 md:right-6">
        {!single && (
          <div className="mr-1 flex gap-2">
            {videos.map((video, index) => (
              <button
                key={video.id}
                type="button"
                aria-label={`Play video ${index + 1}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-200 ease-estate ${
                  index === active ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          aria-label={paused ? "Play background video" : "Pause background video"}
          onClick={() => setPaused((p) => !p)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors duration-200 ease-estate hover:bg-white/35 md:h-10 md:w-10"
        >
          {paused ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M3 1.5v11l9-5.5-9-5.5Z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M3 1.5h2.8v11H3zM8.2 1.5H11v11H8.2z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
