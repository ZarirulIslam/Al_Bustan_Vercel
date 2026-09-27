"use client";

import { MAX_IMAGE_MB } from "@/lib/uploadLimits";
import { useState } from "react";
import Image from "next/image";
import { uploadImageClientSide } from "@/lib/uploadClient";

interface UploadedImage {
  id: string;
  url: string;
  fileName: string;
}

export function GalleryImageUploadField({
  fieldName,
  subdir,
  onUploadingChange,
}: {
  fieldName: string;
  subdir: "projects" | "blog" | "gallery" | "hero";
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setErrors([]);
    setPendingCount(files.length);
    onUploadingChange?.(true);

    // Each file is uploaded independently and directly to Supabase —
    // uploading several at once never grows the request our own
    // server has to handle, since the server only ever hands out
    // small signed-URL tokens (see src/lib/uploadClient.ts).
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const url = await uploadImageClientSide(file, subdir);
        return { id: crypto.randomUUID(), url, fileName: file.name };
      })
    );

    const succeeded: UploadedImage[] = [];
    const failed: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        succeeded.push(result.value);
      } else {
        const message = result.reason instanceof Error ? result.reason.message : "Upload failed.";
        failed.push(`${files[i].name}: ${message}`);
      }
    }

    setUploaded((prev) => [...prev, ...succeeded]);
    setErrors(failed);
    setPendingCount(0);
    onUploadingChange?.(false);

    // Let the same input be used again to add more images later.
    e.target.value = "";
  }

  function removeUploaded(id: string) {
    setUploaded((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        disabled={pendingCount > 0}
        className="block w-full text-sm text-ink-soft file:mr-4 file:rounded file:border-0 file:bg-garden-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-garden-700"
      />

      {/* One hidden input per successfully uploaded image, all
          sharing the same name — the server action reads them with
          formData.getAll(fieldName), same pattern already used for
          the gallery-removal checkboxes below. */}
      {uploaded.map((img) => (
        <input key={img.id} type="hidden" name={fieldName} value={img.url} />
      ))}

      {pendingCount > 0 && (
        <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-limestone-300 border-t-garden-500" />
          Uploading {pendingCount} image{pendingCount > 1 ? "s" : ""}…
        </p>
      )}

      {errors.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-red-700">
          {errors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}

      {uploaded.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {uploaded.map((img) => (
            <div key={img.id} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded border border-limestone-300">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 25vw, 33vw"
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeUploaded(img.id)}
                className="mt-1 text-xs text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-xs text-ink-soft">
        {MAX_IMAGE_MB}MB max per image. Each image uploads directly on selection.
      </p>
    </div>
  );
}
