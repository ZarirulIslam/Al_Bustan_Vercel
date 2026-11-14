"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { PublicMediaSlide } from "@/lib/data/mediaSlides";

const IMAGE_MS = 6000; // how long an image (or an unplayed YouTube cover) stays up

// Image + video slider used on the homepage (after the hero) and the
// Contact Us page; slides come from /admin/media-sliders.
// - Images advance on a timer.
// - Uploaded videos play muted when their slide is active and move on
//   when they end (a lone video loops).
// - YouTube slides show the thumbnail; nothing from YouTube loads until
//   the visitor presses play, and the slider stops while it plays.
// Autoplay pauses on hover/focus and is off for "reduce motion".
export function MediaSlider({ slides, label }: { slides: PublicMediaSlide[]; label: string }) {
  const [active, setActive] = useState(0);
  const [youtubePlaying, setYoutubePlaying] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;
  const current = slides[active];

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setYoutubePlaying(null);
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  // Timer for images and unplayed YouTube covers. Uploaded videos
  // advance from onEnded instead.
  useEffect(() => {
    if (count < 2 || hovered || reducedMotion || youtubePlaying || current?.kind === "video") return;
    const timer = setTimeout(() => goTo(active + 1), IMAGE_MS);
    return () => clearTimeout(timer);
  }, [active, count, hovered, reducedMotion, youtubePlaying, current?.kind, goTo]);

  // Play the active uploaded video from the start; pause the others.
  useEffect(() => {
    for (const slide of slides) {
      const video = videoRefs.current[slide.id];
      if (!video) continue;
      if (slide.id === current?.id && !reducedMotion) {
        video.currentTime = 0;
        video.play().catch(() => {
          // Autoplay refused (e.g. data saver) — the native controls stay available.
        });
      } else {
        video.pause();
      }
    }
  }, [current?.id, slides, reducedMotion]);

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false);
      }}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === "ArrowRight") goTo(active + 1);
        if (e.key === "ArrowLeft") goTo(active - 1);
      }}
    >
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-garden-900 shadow-card-hover sm:aspect-video"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          const end = e.changedTouches[0]?.clientX;
          if (start == null || end == null || count < 2) return;
          if (Math.abs(end - start) > 50) goTo(active + (end < start ? 1 : -1));
        }}
      >
        {slides.map((slide, index) => {
          const isActive = index === active;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ease-estate ${
                isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            >
              {slide.kind === "image" && slide.url && (
                <Image
                  src={slide.url}
                  alt={slide.caption || label}
                  fill
                  sizes="(min-width: 1280px) 1200px, 100vw"
                  priority={index === 0}
                  className="object-cover"
                />
              )}

              {slide.kind === "video" && slide.url && (
                <video
                  ref={(el) => {
                    videoRefs.current[slide.id] = el;
                  }}
                  src={slide.url}
                  poster={slide.posterUrl ?? undefined}
                  muted
                  playsInline
                  controls
                  loop={count === 1}
                  preload={isActive ? "auto" : "none"}
                  tabIndex={isActive ? 0 : -1}
                  onEnded={() => {
                    if (count > 1 && !hovered) goTo(index + 1);
                  }}
                  className="absolute inset-0 h-full w-full bg-black object-cover"
                />
              )}

              {slide.kind === "youtube" && slide.youtubeId && (
                <YouTubeSlide
                  youtubeId={slide.youtubeId}
                  title={slide.caption || label}
                  playing={youtubePlaying === slide.id}
                  tabbable={isActive}
                  onPlay={() => setYoutubePlaying(slide.id)}
                />
              )}

              {slide.caption && !(slide.kind === "youtube" && youtubePlaying === slide.id) && (
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pt-16 sm:px-8 ${
                    slide.kind === "video" ? "pb-16" : "pb-5 sm:pb-7"
                  }`}
                >
                  <p className="max-w-2xl text-base text-white sm:text-lg">{slide.caption}</p>
                </div>
              )}
            </div>
          );
        })}

        {count > 1 && (
          <>
            <ArrowButton direction="prev" onClick={() => goTo(active - 1)} />
            <ArrowButton direction="next" onClick={() => goTo(active + 1)} />
            <span className="absolute right-4 top-4 z-20 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1 sm:gap-3" aria-label="Choose a slide">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show slide ${index + 1}${slide.kind === "image" ? "" : " (video)"}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
              className={`relative aspect-video w-20 flex-shrink-0 overflow-hidden rounded-lg bg-garden-900 transition-all duration-200 ease-estate sm:w-28 ${
                index === active ? "ring-2 ring-brass ring-offset-2" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Thumb slide={slide} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Thumb({ slide }: { slide: PublicMediaSlide }) {
  const src =
    slide.kind === "image"
      ? slide.url
      : slide.kind === "youtube"
        ? `https://i.ytimg.com/vi/${slide.youtubeId}/mqdefault.jpg`
        : slide.posterUrl;

  return (
    <>
      {src ? (
        <Image src={src} alt="" fill sizes="112px" className="object-cover" />
      ) : slide.kind === "video" && slide.url ? (
        // No cover set: show the video's first frame.
        <video src={`${slide.url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : null}
      {slide.kind !== "image" && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-garden-700">
            <PlayIcon size={10} />
          </span>
        </span>
      )}
    </>
  );
}

function YouTubeSlide({
  youtubeId,
  title,
  playing,
  tabbable,
  onPlay,
}: {
  youtubeId: string;
  title: string;
  playing: boolean;
  tabbable: boolean;
  onPlay: () => void;
}) {
  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={onPlay}
      tabIndex={tabbable ? 0 : -1}
      aria-label={`Play video: ${title}`}
      className="group absolute inset-0"
    >
      <Image
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 1280px) 1200px, 100vw"
        className="object-cover transition-transform duration-700 ease-estate group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-black/20" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-garden-700 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
        <PlayIcon size={22} />
      </span>
    </button>
  );
}

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      className={`absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-garden-800 shadow-md backdrop-blur-sm transition-colors duration-200 ease-estate hover:bg-white sm:flex ${
        direction === "prev" ? "left-4" : "right-4"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={direction === "prev" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function PlayIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5Z" />
    </svg>
  );
}
