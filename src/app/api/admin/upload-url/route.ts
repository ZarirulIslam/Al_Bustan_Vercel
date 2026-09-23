import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdminConfig } from "@/lib/storage/supabase";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from "@/lib/storage/types";
import { randomUUID } from "crypto";

// Why this route exists: Vercel Serverless Functions enforce a hard
// request-body ceiling of roughly 4.5MB, which no next.config.mjs
// setting can raise. A single admin form submission with a cover
// image plus several gallery images would routinely exceed that if
// the file bytes were sent to our own server (whether as a Server
// Action or a normal API route).
//
// The fix is to never send file bytes to our server at all. Instead:
//   1. The browser asks THIS route (tiny JSON body — just a
//      filename/content-type, well under any limit) to prepare an
//      upload slot.
//   2. This route uses the service-role Supabase client to mint a
//      short-lived signed upload URL/token for that exact path.
//   3. The browser uploads the actual file bytes directly to
//      Supabase Storage using that token (src/lib/uploadClient.ts) —
//      that request goes straight from the browser to Supabase, and
//      never touches our Vercel function, so its size is irrelevant
//      to our platform's request-body limit.
//   4. Only the resulting public URL (a short string) is later
//      submitted with the rest of the admin form.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { subdir, contentType } = (body ?? {}) as {
    subdir?: unknown;
    contentType?: unknown;
  };

  if (!isAllowedSubdir(subdir)) {
    return NextResponse.json({ error: "Invalid upload category." }, { status: 400 });
  }

  const isBrochure = subdir === "brochures";
  const allowedTypes = isBrochure ? ALLOWED_DOCUMENT_TYPES : ALLOWED_IMAGE_TYPES;
  if (typeof contentType !== "string" || !allowedTypes.includes(contentType)) {
    return NextResponse.json(
      {
        error: isBrochure
          ? "Unsupported file type. Use PDF."
          : "Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
      },
      { status: 400 }
    );
  }

  try {
    const { client, bucket } = getSupabaseAdminConfig();

    const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${subdir}/${randomUUID()}.${ext}`;

    const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      // Logged server-side only — the raw Supabase error can include
      // bucket/path/internal details that shouldn't reach the client.
      console.error("createSignedUploadUrl failed:", error);
      return NextResponse.json({ error: "Could not prepare upload." }, { status: 500 });
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      bucket,
      path: data.path,
      token: data.token,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error("upload-url failed:", err);
    return NextResponse.json({ error: "Could not prepare upload." }, { status: 500 });
  }
}
