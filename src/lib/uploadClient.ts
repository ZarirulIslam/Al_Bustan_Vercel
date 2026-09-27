"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import { MAX_DOCUMENT_BYTES, MAX_DOCUMENT_MB, MAX_IMAGE_BYTES, MAX_IMAGE_MB } from "@/lib/uploadLimits";

type UploadSubdir = "projects" | "blog" | "settings" | "gallery" | "brochures" | "hero" | "testimonials" | "team" | "avatars";

// NOTE: this client-side check is a fast, friendly first line of
// feedback only — it is not a security boundary (nothing stops a
// modified client from skipping it). The real enforcement for the
// Supabase path is the max file size configured on the bucket itself
// (set this when creating the bucket — see .env.example / README).
export class ClientUploadError extends Error {}

async function uploadViaLocalDevRoute(file: File, subdir: UploadSubdir): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subdir", subdir);

  const res = await fetch("/api/admin/upload-local", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ClientUploadError(data.error || "Upload failed.");
  }
  return data.publicUrl as string;
}

async function uploadViaSupabaseSignedUrl(file: File, subdir: UploadSubdir): Promise<string> {
  // 1. Ask our server for a short-lived, single-use upload slot.
  // This request body is tiny (no file bytes), so it's nowhere near
  // any request-size limit.
  const prepRes = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subdir, contentType: file.type }),
  });

  const prepData = await prepRes.json().catch(() => ({}));
  if (!prepRes.ok) {
    throw new ClientUploadError(prepData.error || "Could not prepare upload.");
  }

  const { bucket, path, token, publicUrl } = prepData as {
    bucket: string;
    path: string;
    token: string;
    publicUrl: string;
  };

  // 2. Upload the actual file bytes directly to Supabase Storage,
  // browser-to-Supabase. This never passes through our Vercel
  // function, so its size is irrelevant to that platform's request
  // body limit — only Supabase's own bucket file-size limit applies.
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType: file.type,
  });

  if (error) {
    throw new ClientUploadError(`Upload failed: ${error.message}`);
  }

  return publicUrl;
}

async function uploadClientSide(file: File, subdir: UploadSubdir): Promise<string> {
  // Mirrors the server-only STORAGE_PROVIDER (see .env.example) so
  // local development can keep working without a Supabase project —
  // that path has no Vercel-style request-size ceiling to worry
  // about, so it's fine for the file to go through our own server
  // there. Production/Vercel should always use "supabase".
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "supabase";

  if (provider === "local") {
    return uploadViaLocalDevRoute(file, subdir);
  }
  return uploadViaSupabaseSignedUrl(file, subdir);
}

export async function uploadImageClientSide(
  file: File,
  subdir: Exclude<UploadSubdir, "brochures">
): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ClientUploadError(`Image is too large (${MAX_IMAGE_MB}MB max).`);
  }
  return uploadClientSide(file, subdir);
}

export async function uploadDocumentClientSide(file: File): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new ClientUploadError("Unsupported file type. Use PDF.");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new ClientUploadError(`File is too large (${MAX_DOCUMENT_MB}MB max).`);
  }
  return uploadClientSide(file, "brochures");
}
