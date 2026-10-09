"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProjectImage } from "@/lib/types";
import { cn } from "@/lib/utils";

// Cross-fading background photos for the apartment hero, with vertical
// slide dots and a "scroll" cue on the right edge. Pauses for visitors
// who prefer reduced motion.
export function HeroSlideshow({ images }: { images: ProjectImage[] }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => window.clearInterval(timer);
  }, [count]);

  return (
    <>
      {images.map((image, i) => (
        <Image
          key={image.id}
          src={image.url}
          alt={i === 0 ? image.alt : ""}
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            "-z-20 object-cover transition-opacity duration-1000 ease-estate",
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      <div className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-10 md:flex">
        {count > 1 && (
          <div className="flex flex-col gap-2.5">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "w-2.5 rounded-full transition-all duration-300",
                  i === index ? "h-6 bg-white" : "h-2.5 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
        <a href="#overview" className="flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white">
          <span className="[writing-mode:vertical-rl]">Scroll</span>
          <span aria-hidden className="h-12 w-px bg-white/40" />
        </a>
      </div>
    </>
  );
}
