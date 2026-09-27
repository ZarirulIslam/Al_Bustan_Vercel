import { MAX_DOCUMENT_BYTES, MAX_DOCUMENT_MB, MAX_IMAGE_BYTES, MAX_IMAGE_MB } from "@/lib/uploadLimits";

// A storage provider only needs to do one thing: take a File and a
// subdirectory/category, persist it somewhere, and return a public
// URL. Every CMS server action (project images, and blog/settings
// images in later phases) depends only on this interface — swapping
// local disk for S3, Cloudinary, or any other provider means writing
// one new file that implements it and changing STORAGE_PROVIDER in
// .env. No CMS or form code needs to change.
export interface StorageProvider {
  saveImage(file: File, subdir: string): Promise<string>;
  // Optional — only "brochures" uploads need this. Same idea as
  // saveImage but validated as a document (PDF) instead.
  saveDocument?(file: File, subdir: string): Promise<string>;
  // Best-effort cleanup of a previously-saved image, given the public
  // URL saveImage returned. Optional because not every provider can
  // cheaply support it, and callers must never let a delete failure
  // block a database mutation — it's cleanup, not a source of truth.
  deleteImage?(url: string): Promise<void>;
}

export class UnsupportedImageTypeError extends Error {}
export class ImageTooLargeError extends Error {}
export class UnsupportedDocumentTypeError extends Error {}
export class DocumentTooLargeError extends Error {}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Limits live in src/lib/uploadLimits.ts (shared with the browser-side
// check); re-exported here for existing server-side imports.
export { MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES } from "@/lib/uploadLimits";

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new UnsupportedImageTypeError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageTooLargeError(`Image is too large (${MAX_IMAGE_MB}MB max).`);
  }
}

// Brochures upload the same way images do (direct-to-Supabase via a
// signed URL — see src/lib/uploadClient.ts), just with a different
// allowed type/size. Kept generous since a brochure is one file per
// project, uploaded rarely, unlike the multi-image project forms.
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

export function validateDocumentFile(file: File) {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    throw new UnsupportedDocumentTypeError("Unsupported file type. Use PDF.");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new DocumentTooLargeError(`File is too large (${MAX_DOCUMENT_MB}MB max).`);
  }
}
