import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { validateImageFile, validateDocumentFile, type StorageProvider } from "@/lib/storage/types";

// Shared server-side (service role) Supabase client + bucket config,
// used both by SupabaseStorageProvider below (server-initiated
// uploads) and by the signed-upload-URL route handler
// (src/app/api/admin/upload-url/route.ts) that powers direct
// browser-to-Supabase uploads. Centralized here so the env var
// checks and client construction only happen in one place.
export function getSupabaseAdminConfig(): {
  client: SupabaseClient;
  bucket: string;
} {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!url || !serviceRoleKey || !bucket) {
    throw new Error(
      "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET must all be set to use Supabase Storage. See .env.example."
    );
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return { client, bucket };
}

export function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

// Uploads to Supabase Storage and returns the public URL. This is
// the provider used when a File is already available server-side
// (kept for any future/other server-initiated upload path). The
// admin CMS forms themselves no longer route file bytes through
// this — see src/lib/uploadClient.ts for why and how.
//
// Requires a PUBLIC Supabase Storage bucket (read access open, write
// access only via this server-side client using the service role
// key, which never reaches the browser).
export class SupabaseStorageProvider implements StorageProvider {
  private async saveFile(file: File, subdir: string): Promise<string> {
    const { client, bucket } = getSupabaseAdminConfig();

    const ext = (file.type.split("/")[1] || "bin").replace("jpeg", "jpg");
    const path = `${subdir}/${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await client.storage.from(bucket).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async saveImage(file: File, subdir: string): Promise<string> {
    validateImageFile(file);
    return this.saveFile(file, subdir);
  }

  async saveDocument(file: File, subdir: string): Promise<string> {
    validateDocumentFile(file);
    return this.saveFile(file, subdir);
  }

  async deleteImage(url: string): Promise<void> {
    const { client, bucket } = getSupabaseAdminConfig();
    const path = extractStoragePath(url, bucket);
    if (!path) return;
    await client.storage.from(bucket).remove([path]);
  }
}
