"use client";

import { useEffect, useState } from "react";

// Homepage hero background playing the Video Library's hero video
// through YouTube's embedded player: muted, looping, no controls, sized
// to cover the hero like a background. The thumbnail shows until the
// player is ready (and stays for visitors who prefer reduced motion).
export function HeroYouTube({ youtubeId, title }: { youtubeId: string; title: string }) {
  const [play, setPlay] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlay(true);
  }, []);

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: youtubeId, // required for loop
    controls: "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    iv_load_policy: "3",
    disablekb: "1",
  });

  return (
    <>
      {/* container-type: size lets the player size itself from the hero
          box (cqw/cqh), not the browser window. */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-garden-900 [container-type:size]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
          onError={(e) => {
            e.currentTarget.src = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
          }}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`}
        />
        {play && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            tabIndex={-1}
            aria-hidden="true"
            onLoad={() => setTimeout(() => setReady(true), 1200)}
            // Smallest 16:9 box that still covers the hero: only the
            // overflowing edge is cropped, with no extra zoom.
            className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 border-0"
          />
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(0deg, rgba(8,31,20,0.88) 0%, rgba(8,31,20,0.52) 45%, rgba(8,31,20,0.18) 75%)",
        }}
      />
    </>
  );
}
