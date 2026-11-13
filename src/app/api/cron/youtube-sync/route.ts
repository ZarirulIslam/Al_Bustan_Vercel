import { syncYouTube, syncYouTubeIfStale } from "@/lib/youtube/sync";

// Daily backstop for the YouTube import (vercel.json "crons"). Most new
// videos arrive sooner: the homepage triggers a sync after rendering
// when the last one is over 30 minutes old, and the Video Library syncs
// when opened. Vercel sends "Authorization: Bearer $CRON_SECRET" when
// CRON_SECRET is set.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Without a secret anyone can call this URL, so allow at most one
  // sync per 10 minutes.
  const result = secret ? await syncYouTube() : await syncYouTubeIfStale(10 * 60 * 1000);
  if (!result) return Response.json({ skipped: "synced recently" });
  return Response.json(result, { status: result.error ? 500 : 200 });
}
