"use client";

import { createClient } from "@supabase/supabase-js";

// The anon key is meant to be public — it's what every Supabase
// client-side SDK ships with. It grants no special access on its
// own; the actual permission to write to a specific storage path
// comes from the short-lived token minted server-side in
// src/app/api/admin/upload-url/route.ts (which uses the secret
// service role key, kept server-only). Never put the service role
// key in a NEXT_PUBLIC_* variable.
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for admin image uploads to work. See .env.example."
    );
  }

  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}
