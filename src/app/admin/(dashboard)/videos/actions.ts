"use server";

import { revalidatePath } from "next/cache";
import type { VideoSection } from "@prisma/client";
import { requireSectionAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { youtubeId } from "@/lib/projectSections";
import { resolveChannel, syncYouTube } from "@/lib/youtube/sync";

async function requireAdmin() {
  await requireSectionAccess("videos");
}

const SECTIONS: VideoSection[] = ["homepage_hero", "testimonials", "about", "project"];

// Placements show on the homepage, About and project pages.
function revalidateVideoPages() {
  revalidatePath("/", "layout");
}

export async function saveYouTubeChannel(input: string) {
  await requireAdmin();
  let channel;
  try {
    channel = await resolveChannel(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't find that channel." };
  }
  await prisma.youTubeSync.upsert({
    where: { id: "singleton" },
    update: { channelId: channel.id, channelTitle: channel.title, lastError: null },
    create: { id: "singleton", channelId: channel.id, channelTitle: channel.title },
  });
  await logActivity({ action: "updated", resource: "YouTubeSync", description: `Set the YouTube channel to ${channel.title ?? channel.id}` });

  const result = await syncYouTube();
  revalidatePath("/admin/videos");
  if (result.error) return { error: result.error };
  return { message: `Channel saved. ${result.imported} new video${result.imported === 1 ? "" : "s"} imported.` };
}

export async function syncYouTubeNow() {
  await requireAdmin();
  const result = await syncYouTube();
  revalidatePath("/admin/videos");
  if (result.error) return { error: result.error };
  return {
    message:
      result.imported > 0
        ? `${result.imported} new video${result.imported === 1 ? "" : "s"} imported — review and publish ${result.imported === 1 ? "it" : "them"} below.`
        : "Up to date — no new videos on the channel.",
  };
}

// For a video the feed can't see (unlisted, or older than the latest
// 15 without an API key). Title and thumbnail come from YouTube oEmbed.
export async function addVideoByLink(url: string) {
  await requireAdmin();
  const id = youtubeId(url.trim());
  if (!id) return { error: "Paste a YouTube link (youtube.com/watch?v=… or youtu.be/…)." };
  if (await prisma.youTubeVideo.findUnique({ where: { youtubeId: id } })) return { error: "That video is already in the library." };

  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, {
    cache: "no-store",
  });
  if (!res.ok) return { error: "YouTube couldn't find that video, or it doesn't allow embedding." };
  const info = (await res.json()) as { title?: string; thumbnail_url?: string };

  await prisma.youTubeVideo.create({
    data: {
      youtubeId: id,
      title: info.title || "Untitled video",
      thumbnailUrl: info.thumbnail_url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      publishedAt: new Date(),
      source: "manual",
      published: false,
    },
  });
  await logActivity({ action: "created", resource: "YouTubeVideo", description: `Added "${info.title ?? id}" to the Video Library` });
  revalidatePath("/admin/videos");
  return { message: "Video added. Publish it and choose where it appears." };
}

export async function setVideoPublished(id: string, published: boolean) {
  await requireAdmin();
  const video = await prisma.youTubeVideo.update({ where: { id }, data: { published } });
  await logActivity({
    action: published ? "published" : "unpublished",
    resource: "YouTubeVideo",
    resourceId: id,
    description: `${published ? "Published" : "Unpublished"} video "${video.title}"`,
  });
  revalidateVideoPages();
}

// Turns one placement of a video on or off. The homepage hero holds a
// single video, so placing one there removes any other.
export async function setVideoPlacement(videoId: string, section: VideoSection, projectId: string | null, on: boolean) {
  await requireAdmin();
  if (!SECTIONS.includes(section)) return;
  const target = section === "project" ? projectId : null;
  if (section === "project" && !target) return;

  const where = { videoId, section, projectId: target };
  if (!on) {
    await prisma.videoPlacement.deleteMany({ where });
  } else if (!(await prisma.videoPlacement.findFirst({ where }))) {
    if (section === "homepage_hero") await prisma.videoPlacement.deleteMany({ where: { section } });
    const last = await prisma.videoPlacement.findFirst({
      where: { section, projectId: target },
      orderBy: { order: "desc" },
    });
    await prisma.videoPlacement.create({ data: { ...where, order: (last?.order ?? -1) + 1 } });
  }
  await logActivity({
    action: "updated",
    resource: "VideoPlacement",
    resourceId: videoId,
    description: `${on ? "Placed" : "Removed"} a video ${on ? "on" : "from"} ${section.replace("_", " ")}`,
  });
  revalidateVideoPages();
  revalidatePath("/admin/videos");
}

export async function setPlacementActive(id: string, active: boolean) {
  await requireAdmin();
  await prisma.videoPlacement.update({ where: { id }, data: { active } });
  revalidateVideoPages();
  revalidatePath("/admin/videos");
}

export async function movePlacement(id: string, direction: "up" | "down") {
  await requireAdmin();
  const current = await prisma.videoPlacement.findUnique({ where: { id } });
  if (!current) return;
  const siblings = await prisma.videoPlacement.findMany({
    where: { section: current.section, projectId: current.projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const index = siblings.findIndex((p) => p.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;
  [siblings[index], siblings[swapIndex]] = [siblings[swapIndex], siblings[index]];
  await prisma.$transaction(siblings.map((p, i) => prisma.videoPlacement.update({ where: { id: p.id }, data: { order: i } })));
  revalidateVideoPages();
  revalidatePath("/admin/videos");
}
