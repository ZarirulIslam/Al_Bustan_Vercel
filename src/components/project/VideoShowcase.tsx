"use client";

import { useState } from "react";
import Image from "next/image";
import { youtubeId } from "@/lib/projectSections";
import { cn } from "@/lib/utils";
import { SHARED_COPY, type ProjectLocale } from "@/lib/projectCopy";

// Featured YouTube player + playlist. The player shows a thumbnail
// until clicked (no YouTube JS loads until the visitor actually wants
// to watch), then swaps in the privacy-enhanced embed.
export function VideoShowcase({
  urls,
  projectName,
  locale = "en",
}: {
  urls: string[];
  projectName: string;
  locale?: ProjectLocale;
}) {
  const t = SHARED_COPY[locale].video;
  const ids = urls.map(youtubeId).filter((id): id is string => id !== null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  if (ids.length === 0) return null;
  const activeId = ids[active];

  return (
    <div className={cn("grid gap-6", ids.length > 1 && "lg:grid-cols-[1fr_320px]")}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-card-hover">
        <div className="relative aspect-video">
          {playing ? (
            <iframe
              key={activeId}
              src={`https://www.youtube-nocookie.com/embed/${activeId}?autoplay=1&rel=0`}
              title={`${projectName} — video ${active + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0"
              aria-label={`${t.play} ${active + 1}`}
            >
              <Image
                src={`https://i.ytimg.com/vi/${activeId}/hqdefault.jpg`}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover transition-transform duration-700 ease-estate group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
              <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/40 backdrop-blur transition-transform duration-300 group-hover:scale-110">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brass text-white shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5Z" />
                  </svg>
                </span>
              </span>
              <span className="absolute left-1/2 top-[calc(50%+3.25rem)] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
                ▶ {t.play}
              </span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brass-light">
              {t.nowShowing} · {t.video} {String(active + 1).padStart(2, "0")}
            </p>
            <p className="mt-1 font-display text-lg text-white">{projectName}</p>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${activeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-white/70 transition-colors hover:text-white"
          >
            {t.watchOnYouTube}
          </a>
        </div>
      </div>

      {ids.length > 1 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="px-2 pb-2 pt-1 text-xs uppercase tracking-[0.18em] text-white/50">{t.moreVideos}</p>
          <ul className="space-y-2 lg:max-h-[420px] lg:overflow-y-auto">
            {ids.map((id, i) => (
              <li key={`${id}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setPlaying(i === active ? playing : false);
                  }}
                  aria-current={i === active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors duration-200",
                    i === active
                      ? "border-garden-300/60 bg-garden-500/20"
                      : "border-transparent hover:border-white/10 hover:bg-white/5"
                  )}
                >
                  <span className="relative aspect-video w-28 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" fill sizes="112px" className="object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                        <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5Z" />
                      </svg>
                    </span>
                  </span>
                  <span>
                    <span className="block text-xs text-brass-light">{t.video} {String(i + 1).padStart(2, "0")}</span>
                    <span className="mt-0.5 block text-sm text-white">{i === active ? t.nowSelected : t.clickToWatch}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
