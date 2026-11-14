import Link from "next/link";
import { MediaSlidesManager } from "@/components/admin/MediaSlidesManager";
import {
  MEDIA_SLIDER_PLACEMENTS,
  getLibraryVideoOptions,
  getMediaSlidesAdmin,
  isMediaSliderPlacement,
} from "@/lib/admin/mediaSlides";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMediaSlidersPage({ searchParams }: { searchParams: Promise<{ slider?: string }> }) {
  const { slider } = await searchParams;
  const placement = isMediaSliderPlacement(slider) ? slider : "homepage";
  const info = MEDIA_SLIDER_PLACEMENTS.find((p) => p.key === placement)!;

  const [slides, libraryVideos] = await Promise.all([getMediaSlidesAdmin(placement), getLibraryVideoOptions()]);
  const published = slides.filter((s) => s.published).length;

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Media Sliders</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Sliders that mix photos, uploaded videos and YouTube videos. Only published slides appear on the site, in the order
          shown below. A slider with no published slides is hidden.
        </p>
      </div>

      <nav className="mt-6 flex gap-2" aria-label="Choose a slider">
        {MEDIA_SLIDER_PLACEMENTS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/media-sliders?slider=${p.key}`}
            aria-current={p.key === placement ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150",
              p.key === placement
                ? "bg-garden-700 text-white"
                : "border border-limestone-300 bg-white text-ink-soft hover:border-garden-300 hover:text-garden-700"
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink-soft">Shows on {info.where}.</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            published > 0 ? "bg-garden-100 text-garden-700" : "bg-limestone-200 text-ink-soft"
          )}
        >
          {published > 0 ? `${published} published — showing on the site` : "Not showing now"}
        </span>
      </div>

      <div className="mt-8">
        <MediaSlidesManager key={placement} placement={placement} slides={slides} libraryVideos={libraryVideos} />
      </div>
    </div>
  );
}
