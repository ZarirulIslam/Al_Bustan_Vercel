"use client";

import { useState } from "react";
import { uploadDocumentClientSide } from "@/lib/uploadClient";

export function BrochureUploadField({
  fieldName,
  existingUrl,
  onUploadingChange,
}: {
  fieldName: string;
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
      const publicUrl = await uploadDocumentClientSide(file);
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

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
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
        <a
          href={existingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs font-medium text-garden-700 hover:underline"
        >
          View current brochure ↗
        </a>
      )}

      <p className="mt-1.5 text-xs text-ink-soft">PDF only, 10MB max. Optional.</p>
    </div>
  );
}
