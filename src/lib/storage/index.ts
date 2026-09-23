import { LocalStorageProvider } from "@/lib/storage/local";
import { SupabaseStorageProvider } from "@/lib/storage/supabase";
import type { StorageProvider } from "@/lib/storage/types";

// To add another cloud provider later: create e.g. src/lib/storage/s3.ts
// implementing StorageProvider, import it here, and add a case for
// it below. Set STORAGE_PROVIDER accordingly in .env. Nothing in the
// admin forms or server actions needs to change — they only ever
// call saveImage() from this file.
//
// Defaults to "supabase" because "local" (writing to /public/uploads
// on disk) does not work on Vercel or any other serverless host —
// the filesystem there is ephemeral and not shared across function
// instances, so uploaded images would appear to "work" for one
// request and then 404 on the next. Use STORAGE_PROVIDER=local only
// for local development without a Supabase project configured.
function getProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "supabase";

  switch (provider) {
    case "local":
      return new LocalStorageProvider();
    case "supabase":
      return new SupabaseStorageProvider();
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER "${provider}". Supported values: "local", "supabase".`
      );
  }
}

export async function saveImage(file: File, subdir: string): Promise<string> {
  return getProvider().saveImage(file, subdir);
}

// Best-effort — never throws. Callers can fire-and-forget this after
// a mutation succeeds; a cleanup failure should never roll back or
// block the database change.
export async function deleteImage(url: string): Promise<void> {
  try {
    const provider = getProvider();
    await provider.deleteImage?.(url);
  } catch {
    // Orphaned file left behind; not worth failing the request over.
  }
}

export { UnsupportedImageTypeError, ImageTooLargeError } from "@/lib/storage/types";

