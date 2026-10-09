"use client";

import { useState } from "react";
import Image from "next/image";
import { youtubeId } from "@/lib/projectSections";

// Single YouTube video shown as its thumbnail until clicked — no YouTube
// scripts load until the visitor actually plays it.
export function LiteYouTube({ url, title, playLabel }: { url: string; title: string; playLabel: string }) {
  const id = youtubeId(url);
  const [playing, setPlaying] = useState(false);
  if (!id) return null;

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-garden-900 shadow-card-hover ring-4 ring-white">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={playLabel}>
          <Image
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-estate group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/20" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-garden-700 shadow-lg transition-transform duration-300 group-hover:scale-110">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5Z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
