import { prisma } from "@/lib/prisma";

// Imports the official channel's videos into the Video Library
// (YouTubeVideo). Metadata only — videos play via YouTube's embed.
//
// Source:
//  - RSS feed (default): free, no key, no quota; new public videos show
//    up within minutes, but it lists only the latest 15.
//  - YouTube Data API v3 (when YOUTUBE_API_KEY is set): also backfills
//    older uploads and video lengths. A sync costs ~2–6 quota units of
//    the free 10,000/day.
// New videos arrive unpublished; existing ones only get their title,
// description and thumbnail refreshed (never their published state).

const UA = "Mozilla/5.0 (compatible; AlBustanVideoSync/1.0)";
const API_MAX_PAGES = 4; // 4 × 50 = latest 200 uploads

export interface ImportedVideo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  publishedAt: Date;
  durationSeconds: number | null;
}

export interface SyncResult {
  imported: number;
  seen: number;
  source: "rss" | "api";
  error?: string;
}

const CHANNEL_ID = /^UC[\w-]{22}$/;

function decodeXml(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .trim();
}

// A channel ID (UC…), a /channel/UC… link, an @handle, or any channel
// URL → { id, title }. Handles and custom URLs are looked up on the
// channel's public page.
export async function resolveChannel(input: string): Promise<{ id: string; title: string | null }> {
  const value = input.trim();
  if (!value) throw new Error("Enter your YouTube channel link, @handle or channel ID.");
  if (CHANNEL_ID.test(value)) return { id: value, title: null };

  const direct = value.match(/\/channel\/(UC[\w-]{22})/);
  if (direct) return { id: direct[1], title: null };

  const url = value.startsWith("@")
    ? `https://www.youtube.com/${value}`
    : /^https?:\/\//i.test(value)
      ? value
      : `https://www.youtube.com/@${value.replace(/^@/, "")}`;
  if (!/^https:\/\/(www\.|m\.)?youtube\.com\//i.test(url)) {
    throw new Error("That isn't a YouTube channel link.");
  }

  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" }, cache: "no-store" });
  if (!res.ok) throw new Error(`YouTube couldn't find that channel (HTTP ${res.status}).`);
  const html = await res.text();
  const id =
    html.match(/"externalId":"(UC[\w-]{22})"/)?.[1] ??
    html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1] ??
    html.match(/"channelId":"(UC[\w-]{22})"/)?.[1];
  if (!id) throw new Error("Couldn't read the channel ID from that page. Paste the channel ID (starts with UC) instead.");
  const title = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  return { id, title: title ? decodeXml(title) : null };
}

export async function fetchFromRss(channelId: string): Promise<{ title: string | null; videos: ImportedVideo[] }> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (res.status === 404) throw new Error("YouTube has no public feed for that channel ID.");
  if (!res.ok) throw new Error(`YouTube feed returned HTTP ${res.status}.`);
  const xml = await res.text();

  const channelTitle = xml.match(/<feed[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1];
  const videos: ImportedVideo[] = [];
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const youtubeId = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!youtubeId || !published) continue;
    videos.push({
      youtubeId,
      title: decodeXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "") || "Untitled video",
      description: decodeXml(entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? ""),
      thumbnailUrl: entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] ?? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      publishedAt: new Date(published),
      durationSeconds: null,
    });
  }
  return { title: channelTitle ? decodeXml(channelTitle) : null, videos };
}

// "PT1H2M3S" → 3723
function isoDuration(value: string | undefined): number | null {
  const m = value?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

async function api<T>(path: string, params: Record<string, string>, key: string): Promise<T> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries({ ...params, key })) url.searchParams.set(k, v);
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`YouTube API: ${body?.error?.message ?? `HTTP ${res.status}`}`);
  return body as T;
}

type Thumbs = Record<string, { url: string } | undefined>;
const bestThumb = (t: Thumbs | undefined) => t?.maxres?.url ?? t?.standard?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? null;

export async function fetchFromApi(channelId: string, key: string): Promise<{ title: string | null; videos: ImportedVideo[] }> {
  const channel = await api<{ items?: { snippet: { title: string }; contentDetails: { relatedPlaylists: { uploads: string } } }[] }>(
    "channels",
    { part: "snippet,contentDetails", id: channelId },
    key
  );
  const info = channel.items?.[0];
  if (!info) throw new Error("YouTube API couldn't find that channel.");

  const videos: ImportedVideo[] = [];
  let pageToken = "";
  for (let page = 0; page < API_MAX_PAGES; page++) {
    const list = await api<{
      nextPageToken?: string;
      items: { snippet: { title: string; description: string; thumbnails: Thumbs; resourceId: { videoId: string } }; contentDetails: { videoPublishedAt?: string } }[];
    }>(
      "playlistItems",
      { part: "snippet,contentDetails", playlistId: info.contentDetails.relatedPlaylists.uploads, maxResults: "50", ...(pageToken && { pageToken }) },
      key
    );
    for (const item of list.items) {
      const youtubeId = item.snippet.resourceId.videoId;
      // Private/deleted uploads come back without a publish date.
      if (!item.contentDetails.videoPublishedAt) continue;
      videos.push({
        youtubeId,
        title: item.snippet.title || "Untitled video",
        description: item.snippet.description ?? "",
        thumbnailUrl: bestThumb(item.snippet.thumbnails) ?? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        publishedAt: new Date(item.contentDetails.videoPublishedAt),
        durationSeconds: null,
      });
    }
    if (!list.nextPageToken) break;
    pageToken = list.nextPageToken;
  }

  // Durations, 50 ids per call.
  for (let i = 0; i < videos.length; i += 50) {
    const batch = videos.slice(i, i + 50);
    const details = await api<{ items: { id: string; contentDetails: { duration: string } }[] }>(
      "videos",
      { part: "contentDetails", id: batch.map((v) => v.youtubeId).join(",") },
      key
    );
    const byId = new Map(details.items.map((d) => [d.id, isoDuration(d.contentDetails.duration)]));
    for (const v of batch) v.durationSeconds = byId.get(v.youtubeId) ?? null;
  }

  return { title: info.snippet.title, videos };
}

// The channel to sync: the saved one, else the YouTube link in Website
// Settings (resolved once and saved).
async function channelToSync() {
  const state = await prisma.youTubeSync.findUnique({ where: { id: "singleton" } });
  if (state?.channelId) return state.channelId;
  const settings = await prisma.websiteSettings.findUnique({ where: { id: "singleton" }, select: { youtubeUrl: true } });
  if (!settings?.youtubeUrl) return null;
  const { id, title } = await resolveChannel(settings.youtubeUrl);
  await prisma.youTubeSync.upsert({
    where: { id: "singleton" },
    update: { channelId: id, channelTitle: title },
    create: { id: "singleton", channelId: id, channelTitle: title },
  });
  return id;
}

export async function syncYouTube(): Promise<SyncResult> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  const source = key ? "api" : "rss";
  try {
    const channelId = await channelToSync();
    if (!channelId) {
      throw new Error("No YouTube channel set. Add your channel in the Video Library (or the YouTube link in Website Settings).");
    }

    const { title, videos } = key ? await fetchFromApi(channelId, key) : await fetchFromRss(channelId);

    const existing = await prisma.youTubeVideo.findMany({
      where: { youtubeId: { in: videos.map((v) => v.youtubeId) } },
      select: { youtubeId: true },
    });
    const known = new Set(existing.map((v) => v.youtubeId));
    const fresh = videos.filter((v) => !known.has(v.youtubeId));

    await prisma.$transaction([
      prisma.youTubeVideo.createMany({
        data: fresh.map((v) => ({ ...v, source, published: false })),
        skipDuplicates: true,
      }),
      // Keep metadata current; never touch the published state.
      ...videos
        .filter((v) => known.has(v.youtubeId))
        .map((v) =>
          prisma.youTubeVideo.update({
            where: { youtubeId: v.youtubeId },
            data: {
              title: v.title,
              description: v.description,
              thumbnailUrl: v.thumbnailUrl,
              ...(v.durationSeconds !== null && { durationSeconds: v.durationSeconds }),
            },
          })
        ),
      prisma.youTubeSync.upsert({
        where: { id: "singleton" },
        update: { lastSyncedAt: new Date(), lastError: null, lastImported: fresh.length, ...(title && { channelTitle: title }) },
        create: { id: "singleton", channelId, channelTitle: title, lastSyncedAt: new Date(), lastImported: fresh.length },
      }),
    ]);

    return { imported: fresh.length, seen: videos.length, source };
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube sync failed.";
    await prisma.youTubeSync
      .upsert({
        where: { id: "singleton" },
        update: { lastSyncedAt: new Date(), lastError: message },
        create: { id: "singleton", lastSyncedAt: new Date(), lastError: message },
      })
      .catch(() => {});
    return { imported: 0, seen: 0, source, error: message };
  }
}

// Syncs only if the last attempt is older than `maxAgeMs`. Claims the
// slot first (conditional update), so parallel requests don't all sync.
export async function syncYouTubeIfStale(maxAgeMs: number): Promise<SyncResult | null> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  await prisma.youTubeSync.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
  const claimed = await prisma.youTubeSync.updateMany({
    where: { id: "singleton", OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: cutoff } }] },
    data: { lastSyncedAt: new Date() },
  });
  if (claimed.count === 0) return null;
  return syncYouTube();
}
