// Upload size limits — the single source of truth for the browser-side
// check (src/lib/uploadClient.ts), the server-side validation
// (src/lib/storage/types.ts) and the hints shown under upload fields.
// Safe to import from client components.
//
// File bytes go browser → Supabase directly (see
// src/app/api/admin/upload-url/route.ts), so Vercel's ~4.5MB request
// ceiling doesn't apply. The bucket has no file-size limit of its own,
// so the Supabase project's global upload limit is the only other cap.
export const MAX_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

export const MAX_DOCUMENT_MB = 10;
export const MAX_DOCUMENT_BYTES = MAX_DOCUMENT_MB * 1024 * 1024;
