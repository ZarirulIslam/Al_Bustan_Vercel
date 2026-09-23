import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LocalStorageProvider } from "@/lib/storage/local";

// Fallback path for local development without a Supabase project
// configured (STORAGE_PROVIDER=local / NEXT_PUBLIC_STORAGE_PROVIDER=local).
// Unlike the Supabase signed-upload-URL flow, this receives the file
// directly — which is fine here because it only ever runs against a
// local dev server with no Vercel-style request-body ceiling to
// worry about. This route is not used when STORAGE_PROVIDER=supabase.
const ALLOWED_SUBDIRS = ["projects", "blog", "settings", "gallery", "brochures", "hero", "testimonials"] as const;
type AllowedSubdir = (typeof ALLOWED_SUBDIRS)[number];

function isAllowedSubdir(value: unknown): value is AllowedSubdir {
  return typeof value === "string" && (ALLOWED_SUBDIRS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // This route always writes to local disk regardless of what called
  // it — if the server is actually configured for Supabase (the
  // production setting), silently accepting a local-disk write here
  // would mean the file 404s after the next cold start on Vercel's
  // ephemeral filesystem. Refuse outright instead of writing
  // something that looks like it worked.
  if (process.env.STORAGE_PROVIDER !== "local") {
    return NextResponse.json(
      { error: "Local storage is not enabled on this server." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const subdir = formData.get("subdir");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!isAllowedSubdir(subdir)) {
    return NextResponse.json({ error: "Invalid upload category." }, { status: 400 });
  }

  try {
    const provider = new LocalStorageProvider();
    const url =
      subdir === "brochures" ? await provider.saveDocument(file, subdir) : await provider.saveImage(file, subdir);
    return NextResponse.json({ publicUrl: url });
  } catch (err) {
    // Logged server-side for debugging; the client only gets a
    // generic message so internal details (paths, SDK errors) never
    // leak in the response body.
    console.error("upload-local failed:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
