"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadImageClientSide } from "@/lib/uploadClient";

export function CoverImageUploadField({
  fieldName,
  subdir,
  existingUrl,
  required,
  onUploadingChange,
}: {
  fieldName: string;
  subdir: "projects" | "blog" | "settings" | "gallery" | "testimonials";
  existingUrl?: string;
  required?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    onUploadingChange?.(true);

    try {
      const publicUrl = await uploadImageClientSide(file, subdir);
      setUrl(publicUrl);
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
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={status === "uploading"}
        className="block w-full text-sm text-ink-soft file:mr-4 file:rounded file:border-0 file:bg-garden-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-garden-700"
      />
      {/* Carries the uploaded image's public URL to the server action
          — the server never receives the raw file. */}
      <input type="hidden" name={fieldName} value={url} />

      {status === "uploading" && (
        <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-limestone-300 border-t-garden-500" />
          Uploading…
        </p>
      )}
      {status === "error" && <p className="mt-1.5 text-xs text-red-700">{error}</p>}

      {previewUrl && (
        <div className="relative mt-3 h-32 w-48 overflow-hidden rounded border border-limestone-300">
          <Image src={previewUrl} alt="Preview" fill sizes="192px" className="object-cover" />
        </div>
      )}

      <p className="mt-1.5 text-xs text-ink-soft">
        {existingUrl && !url
          ? "Leave empty to keep the current image."
          : required
            ? "Required."
            : "Optional."}{" "}
        4MB max.
      </p>
    </div>
  );
}
