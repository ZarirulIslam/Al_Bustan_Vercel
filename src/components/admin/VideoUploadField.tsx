"use client";

import { useState } from "react";
import { uploadVideoClientSide } from "@/lib/uploadClient";
import { MAX_VIDEO_MB } from "@/lib/uploadLimits";

// Same direct-to-storage flow as BrochureUploadField, for one MP4/WebM.
// `removeFieldName` adds a "Remove video" checkbox for the saved one.
export function VideoUploadField({
  fieldName,
  removeFieldName,
  existingUrl,
  onUploadingChange,
}: {
  fieldName: string;
  removeFieldName: string;
  existingUrl?: string | null;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [url, setUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    onUploadingChange?.(true);

    try {
      const publicUrl = await uploadVideoClientSide(file);
      setUrl(publicUrl);
      setFileName(file.name);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
    } finally {
      onUploadingChange?.(false);
    }
  }

  const previewUrl = url || existingUrl;

  return (
    <div>
      {previewUrl && (
        <video
          key={previewUrl}
          src={previewUrl}
          muted
          loop
          playsInline
          controls
          preload="metadata"
          className="mb-3 aspect-square w-full max-w-[240px] rounded-lg border border-limestone-300 bg-black object-cover"
        />
      )}

      <input
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleChange}
        disabled={status === "uploading"}
        className="block w-full text-sm text-ink-soft file:mr-4 file:rounded file:border-0 file:bg-garden-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-garden-700"
      />
      <input type="hidden" name={fieldName} value={url} />

      {status === "uploading" && (
        <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-limestone-300 border-t-garden-500" />
          Uploading…
        </p>
      )}
      {status === "error" && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
      {status === "done" && <p className="mt-1.5 text-xs text-garden-700">{fileName} uploaded.</p>}

      {existingUrl && !url && (
        <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
          <input type="checkbox" name={removeFieldName} value="on" />
          Remove video (show the cover photo instead)
        </label>
      )}

      <p className="mt-1.5 text-xs text-ink-soft">MP4 or WebM, {MAX_VIDEO_MB}MB max. Optional.</p>
    </div>
  );
}
