"use client";

import { useRef, useState, useTransition } from "react";
import type { HeroVideo } from "@prisma/client";
import {
  addHeroVideo,
  deleteHeroVideo,
  moveHeroVideo,
  replaceHeroVideoFile,
  toggleHeroVideoPublished,
} from "@/app/admin/(dashboard)/hero/actions";
import { ClientUploadError, uploadImageClientSide, uploadVideoClientSide } from "@/lib/uploadClient";
import { MAX_IMAGE_MB, MAX_VIDEO_MB } from "@/lib/uploadLimits";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GENERIC_ERROR, useAdminAction, useAdminToast } from "@/components/admin/AdminToaster";

const fileInputClass =
  "block w-full text-sm text-ink-soft file:mr-4 file:rounded file:border-0 file:bg-garden-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-garden-700";

const smallButton =
  "flex-1 rounded-lg border border-limestone-300 py-1 text-xs font-medium text-ink-soft transition-colors duration-150 hover:border-garden-300 hover:text-garden-700 disabled:cursor-not-allowed disabled:opacity-40";

const uploadError = (err: unknown) => (err instanceof ClientUploadError ? err.message : "Upload failed.");

// /admin/hero → Videos: upload MP4/WebM files for the video slider,
// each with an optional cover image shown while it loads.
export function HeroVideosManager({ videos }: { videos: HeroVideo[] }) {
  return (
    <div className="space-y-6">
      <AddHeroVideoForm />
      {videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          description="Add one above. Until a video is published, the homepage shows the image slider."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, index) => (
            <HeroVideoCard key={video.id} video={video} index={index} total={videos.length} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddHeroVideoForm() {
  const toast = useAdminToast();
  const [isSaving, startSaving] = useTransition();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"video" | "poster" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function upload(kind: "video" | "poster", file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(kind);
    try {
      if (kind === "video") setVideoUrl(await uploadVideoClientSide(file));
      else setPosterUrl(await uploadImageClientSide(file, "hero"));
    } catch (err) {
      setError(uploadError(err));
    } finally {
      setUploading(null);
    }
  }

  function save() {
    if (!videoUrl) return;
    startSaving(async () => {
      try {
        const result = await addHeroVideo(videoUrl, posterUrl);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Video added. It's published and plays after the others.");
        setVideoUrl(null);
        setPosterUrl(null);
        setFormKey((k) => k + 1);
      } catch (err) {
        console.error(err);
        toast.error(GENERIC_ERROR);
      }
    });
  }

  return (
    <div key={formKey} className="max-w-xl space-y-4 rounded-xl border border-limestone-300 bg-white p-6 shadow-card">
      <h3 className="text-lg">Add a video</h3>

      <div>
        <label htmlFor="hero-video-file" className="text-sm text-ink">
          Video
        </label>
        <input
          id="hero-video-file"
          type="file"
          accept="video/mp4,video/webm"
          disabled={uploading !== null}
          onChange={(e) => upload("video", e.target.files?.[0])}
          className={`mt-1.5 ${fileInputClass}`}
        />
        <p className="mt-1 text-xs text-ink-soft">
          MP4 or WebM, {MAX_VIDEO_MB}MB max. Landscape works best; 10–30 seconds, no sound needed (it plays muted).
        </p>
        {uploading === "video" && <UploadingNote />}
        {videoUrl && (
          <video src={videoUrl} muted loop autoPlay playsInline className="mt-3 aspect-video w-full rounded-lg bg-black object-cover" />
        )}
      </div>

      <div>
        <label htmlFor="hero-video-poster" className="text-sm text-ink">
          Cover image (optional)
        </label>
        <input
          id="hero-video-poster"
          type="file"
          accept="image/*"
          disabled={uploading !== null}
          onChange={(e) => upload("poster", e.target.files?.[0])}
          className={`mt-1.5 ${fileInputClass}`}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Shown while the video loads on slow connections. Use a still from the video. {MAX_IMAGE_MB}MB max.
        </p>
        {uploading === "poster" && <UploadingNote />}
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="" className="mt-3 aspect-video w-40 rounded-lg object-cover" />
        )}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <Button type="button" disabled={!videoUrl || uploading !== null || isSaving} onClick={save}>
        {isSaving ? "Saving…" : uploading ? "Waiting for upload…" : "Add to video slider"}
      </Button>
    </div>
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

function HeroVideoCard({ video, index, total }: { video: HeroVideo; index: number; total: number }) {
  const { run, isPending } = useAdminAction();
  const [uploading, setUploading] = useState<"url" | "posterUrl" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const busy = isPending || uploading !== null;

  async function replace(field: "url" | "posterUrl", file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(field);
    try {
      const url = field === "url" ? await uploadVideoClientSide(file) : await uploadImageClientSide(file, "hero");
      run(() => replaceHeroVideoFile(video.id, field, url), field === "url" ? "Video replaced." : "Cover image saved.");
    } catch (err) {
      setError(uploadError(err));
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card">
      <div className="relative aspect-video bg-black">
        <video
          key={video.url}
          src={video.url}
          poster={video.posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          controls
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium text-white">
          {index + 1}
        </span>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => toggleHeroVideoPublished(video.id, !video.published),
                video.published ? "Video hidden." : "Video published."
              )
            }
            className={
              video.published
                ? "inline-flex items-center gap-1.5 rounded-full bg-garden-100 px-2.5 py-1 text-xs font-medium text-garden-700"
                : "inline-flex items-center gap-1.5 rounded-full bg-limestone-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
            }
          >
            <span className={`h-1.5 w-1.5 rounded-full ${video.published ? "bg-garden-500" : "bg-ink-soft/50"}`} />
            {video.published ? "Published" : "Hidden"}
          </button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (confirm("Delete this video? This can't be undone.")) run(() => deleteHeroVideo(video.id), "Video deleted.");
            }}
          >
            Delete
          </Button>
        </div>

        <div className="flex gap-2">
          <button type="button" disabled={busy || index === 0} onClick={() => run(() => moveHeroVideo(video.id, "up"))} className={smallButton}>
            ↑ Earlier
          </button>
          <button
            type="button"
            disabled={busy || index === total - 1}
            onClick={() => run(() => moveHeroVideo(video.id, "down"))}
            className={smallButton}
          >
            ↓ Later
          </button>
        </div>

        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => videoInput.current?.click()} className={smallButton}>
            {uploading === "url" ? "Uploading…" : "⟲ Replace video"}
          </button>
          <button type="button" disabled={busy} onClick={() => posterInput.current?.click()} className={smallButton}>
            {uploading === "posterUrl" ? "Uploading…" : video.posterUrl ? "Change cover" : "+ Cover image"}
          </button>
        </div>
        {video.posterUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => replaceHeroVideoFile(video.id, "posterUrl", null), "Cover image removed.")}
            className="w-full text-center text-xs text-ink-soft hover:text-red-700 disabled:opacity-40"
          >
            Remove cover image
          </button>
        )}
        <input
          ref={videoInput}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            replace("url", file);
          }}
        />
        <input
          ref={posterInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            replace("posterUrl", file);
          }}
        />
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    </div>
  );
}
