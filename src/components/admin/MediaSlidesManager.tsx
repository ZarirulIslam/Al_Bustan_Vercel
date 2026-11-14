"use client";

import { useRef, useState, useTransition } from "react";
import type { MediaSlide, MediaSliderPlacement } from "@prisma/client";
import {
  addMediaSlides,
  deleteMediaSlide,
  moveMediaSlide,
  setMediaSlidePoster,
  toggleMediaSlidePublished,
  updateMediaSlideCaption,
  type AddMediaSlideInput,
} from "@/app/admin/(dashboard)/media-sliders/actions";
import { ClientUploadError, uploadImageClientSide, uploadVideoClientSide } from "@/lib/uploadClient";
import { MAX_IMAGE_MB, MAX_VIDEO_MB } from "@/lib/uploadLimits";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GalleryImageUploadField } from "@/components/admin/GalleryImageUploadField";
import { GENERIC_ERROR, useAdminAction, useAdminToast } from "@/components/admin/AdminToaster";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-garden-500";
const fileInputClass =
  "block w-full text-sm text-ink-soft file:mr-4 file:rounded file:border-0 file:bg-garden-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-garden-700";
const smallButton =
  "flex-1 rounded-lg border border-limestone-300 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40";

const uploadError = (err: unknown) => (err instanceof ClientUploadError ? err.message : "Upload failed.");

type Kind = "image" | "video" | "youtube";
const KIND_LABELS: Record<Kind, string> = { image: "Photos", video: "Video file", youtube: "YouTube video" };

export function MediaSlidesManager({
  placement,
  slides,
  libraryVideos,
}: {
  placement: MediaSliderPlacement;
  slides: MediaSlide[];
  libraryVideos: { youtubeId: string; title: string }[];
}) {
  return (
    <div className="space-y-8">
      <AddSlideForm placement={placement} libraryVideos={libraryVideos} />
      {slides.length === 0 ? (
        <EmptyState title="No slides yet" description="Add photos or videos above. The slider stays hidden until one is published." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              index={index}
              total={slides.length}
              libraryTitle={libraryVideos.find((v) => v.youtubeId === slide.youtubeId)?.title}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddSlideForm({
  placement,
  libraryVideos,
}: {
  placement: MediaSliderPlacement;
  libraryVideos: { youtubeId: string; title: string }[];
}) {
  const toast = useAdminToast();
  const [kind, setKind] = useState<Kind>("image");
  const [isSaving, startSaving] = useTransition();
  const [uploading, setUploading] = useState<"images" | "video" | "poster" | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [youtube, setYoutube] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  function reset() {
    setVideoUrl(null);
    setPosterUrl(null);
    setYoutube("");
    setCaption("");
    setError(null);
    setFormKey((k) => k + 1);
  }

  async function uploadFile(target: "video" | "poster", file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(target);
    try {
      if (target === "video") setVideoUrl(await uploadVideoClientSide(file));
      else setPosterUrl(await uploadImageClientSide(file, "gallery"));
    } catch (err) {
      setError(uploadError(err));
    } finally {
      setUploading(null);
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let input: AddMediaSlideInput;
    if (kind === "image") {
      const urls = new FormData(e.currentTarget).getAll("imageUrls").map(String);
      input = { kind, urls, caption };
    } else if (kind === "video") {
      if (!videoUrl) return;
      input = { kind, url: videoUrl, posterUrl, caption };
    } else {
      input = { kind, youtube, caption };
    }
    startSaving(async () => {
      try {
        const result = await addMediaSlides(placement, input);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Added. New slides are published and appear at the end.");
        reset();
      } catch (err) {
        console.error(err);
        toast.error(GENERIC_ERROR);
      }
    });
  }

  const ready =
    uploading === null &&
    !isSaving &&
    (kind === "image" ? true : kind === "video" ? Boolean(videoUrl) : youtube.trim().length > 0);

  return (
    <form
      key={formKey}
      onSubmit={submit}
      className="max-w-2xl space-y-5 rounded-xl border border-limestone-300 bg-white p-6 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg">Add slides</h2>
        <div className="inline-flex rounded-full border border-limestone-300 p-0.5" role="tablist" aria-label="Slide type">
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              disabled={uploading !== null}
              onClick={() => {
                setKind(k);
                setError(null);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
                kind === k ? "bg-garden-700 text-white" : "text-ink-soft hover:text-garden-700"
              )}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {kind === "image" && (
        <GalleryImageUploadField
          fieldName="imageUrls"
          subdir="gallery"
          onUploadingChange={(u) => setUploading(u ? "images" : null)}
        />
      )}

      {kind === "video" && (
        <>
          <div>
            <label htmlFor="media-video-file" className="text-sm text-ink">
              Video
            </label>
            <input
              id="media-video-file"
              type="file"
              accept="video/mp4,video/webm"
              disabled={uploading !== null}
              onChange={(e) => uploadFile("video", e.target.files?.[0])}
              className={`mt-1.5 ${fileInputClass}`}
            />
            <p className="mt-1 text-xs text-ink-soft">
              MP4 or WebM, {MAX_VIDEO_MB}MB max. It starts muted; visitors can turn the sound on.
            </p>
            {uploading === "video" && <UploadingNote />}
            {videoUrl && (
              <video src={videoUrl} muted loop autoPlay playsInline className="mt-3 aspect-video w-full rounded-lg bg-black object-cover" />
            )}
          </div>
          <div>
            <label htmlFor="media-video-poster" className="text-sm text-ink">
              Cover image (optional)
            </label>
            <input
              id="media-video-poster"
              type="file"
              accept="image/*"
              disabled={uploading !== null}
              onChange={(e) => uploadFile("poster", e.target.files?.[0])}
              className={`mt-1.5 ${fileInputClass}`}
            />
            <p className="mt-1 text-xs text-ink-soft">Shown while the video loads and as its thumbnail. {MAX_IMAGE_MB}MB max.</p>
            {uploading === "poster" && <UploadingNote />}
            {posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt="" className="mt-3 aspect-video w-40 rounded-lg object-cover" />
            )}
          </div>
        </>
      )}

      {kind === "youtube" && (
        <div className="space-y-3">
          {libraryVideos.length > 0 && (
            <div>
              <label htmlFor="media-youtube-library" className="text-sm text-ink">
                Pick from the Video Library
              </label>
              <select
                id="media-youtube-library"
                value={libraryVideos.some((v) => v.youtubeId === youtube) ? youtube : ""}
                onChange={(e) => {
                  setYoutube(e.target.value);
                  const title = libraryVideos.find((v) => v.youtubeId === e.target.value)?.title;
                  if (title && !caption) setCaption(title);
                }}
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="">Choose a published video…</option>
                {libraryVideos.map((v) => (
                  <option key={v.youtubeId} value={v.youtubeId}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="media-youtube-url" className="text-sm text-ink">
              {libraryVideos.length > 0 ? "…or paste a YouTube link" : "YouTube link"}
            </label>
            <input
              id="media-youtube-url"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className={`mt-1.5 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-ink-soft">Shows the video&apos;s thumbnail; it plays when a visitor presses play.</p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="media-caption" className="text-sm text-ink">
          Caption (optional{kind === "image" ? ", applied to every photo in this batch" : ""})
        </label>
        <input
          id="media-caption"
          value={caption}
          maxLength={200}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Evening view of the central park"
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <Button type="submit" disabled={!ready}>
        {isSaving ? "Saving…" : uploading ? "Waiting for upload…" : "Add to slider"}
      </Button>
    </form>
  );
}

function UploadingNote() {
  return (
    <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-limestone-300 border-t-garden-500" />
      Uploading…
    </p>
  );
}

function SlideCard({
  slide,
  index,
  total,
  libraryTitle,
}: {
  slide: MediaSlide;
  index: number;
  total: number;
  libraryTitle?: string;
}) {
  const { run, isPending } = useAdminAction();
  const [caption, setCaption] = useState(slide.caption);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const busy = isPending || uploading;
  const captionChanged = caption.trim() !== slide.caption;

  async function changePoster(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImageClientSide(file, "gallery");
      run(() => setMediaSlidePoster(slide.id, url), "Cover image saved.");
    } catch (err) {
      setError(uploadError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card">
      <div className="relative aspect-video bg-black">
        {slide.kind === "image" && slide.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.url} alt="" className="h-full w-full object-cover" />
        )}
        {slide.kind === "video" && slide.url && (
          <video
            key={slide.url}
            src={slide.url}
            poster={slide.posterUrl ?? undefined}
            muted
            playsInline
            preload="metadata"
            controls
            className="h-full w-full object-cover"
          />
        )}
        {slide.kind === "youtube" && slide.youtubeId && (
          <a
            href={`https://www.youtube.com/watch?v=${slide.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="block h-full w-full"
            title="Open on YouTube"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${slide.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
          </a>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium text-white">{index + 1}</span>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-ink">
          {slide.kind === "image" ? "Photo" : slide.kind === "video" ? "Video" : "YouTube"}
        </span>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>
        )}
      </div>

      <div className="space-y-2.5 p-3">
        {libraryTitle && <p className="truncate text-xs text-ink-soft">{libraryTitle}</p>}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() => toggleMediaSlidePublished(slide.id, !slide.published), slide.published ? "Slide hidden." : "Slide published.")
            }
            className={
              slide.published
                ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
            }
          >
            <span className={`h-1.5 w-1.5 rounded-full ${slide.published ? "bg-garden-500" : "bg-ink-soft/50"}`} />
            {slide.published ? "Published" : "Hidden"}
          </button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (confirm("Delete this slide? This can't be undone.")) run(() => deleteMediaSlide(slide.id), "Slide deleted.");
            }}
          >
            Delete
          </Button>
        </div>

        <div className="flex gap-2">
          <input
            aria-label="Caption"
            value={caption}
            maxLength={200}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="min-w-0 flex-1 rounded border border-limestone-300 px-2.5 py-1.5 text-xs text-ink outline-none focus:border-garden-500"
          />
          <button
            type="button"
            disabled={busy || !captionChanged}
            onClick={() => run(() => updateMediaSlideCaption(slide.id, caption), "Caption saved.")}
            className="rounded-lg border border-limestone-300 px-3 text-xs font-medium text-ink-soft hover:border-garden-300 hover:text-garden-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>

        <div className="flex gap-2">
          <button type="button" disabled={busy || index === 0} onClick={() => run(() => moveMediaSlide(slide.id, "up"))} className={smallButton}>
            ↑ Earlier
          </button>
          <button
            type="button"
            disabled={busy || index === total - 1}
            onClick={() => run(() => moveMediaSlide(slide.id, "down"))}
            className={smallButton}
          >
            ↓ Later
          </button>
        </div>

        {slide.kind === "video" && (
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => posterInput.current?.click()} className={smallButton}>
              {uploading ? "Uploading…" : slide.posterUrl ? "Change cover" : "+ Cover image"}
            </button>
            {slide.posterUrl && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => setMediaSlidePoster(slide.id, null), "Cover image removed.")}
                className={smallButton}
              >
                Remove cover
              </button>
            )}
            <input
              ref={posterInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                changePoster(file);
              }}
            />
          </div>
        )}
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    </div>
  );
}
