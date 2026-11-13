import { prisma } from "@/lib/prisma";
import { syncYouTubeIfStale } from "@/lib/youtube/sync";
import { VideoLibrary, type LibraryVideo } from "@/components/admin/VideoLibrary";

export const dynamic = "force-dynamic";

// Opening the library pulls in anything new from the channel (at most
// once every 5 minutes), so a just-published video is usually waiting.
export default async function AdminVideosPage() {
  await syncYouTubeIfStale(5 * 60 * 1000).catch(() => null);

  const [state, videos, projects] = await Promise.all([
    prisma.youTubeSync.findUnique({ where: { id: "singleton" } }),
    prisma.youTubeVideo.findMany({
      orderBy: [{ publishedAt: "desc" }],
      include: { placements: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    }),
    prisma.project.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true },
    }),
  ]);

  const library: LibraryVideo[] = videos.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt.toISOString(),
    durationSeconds: v.durationSeconds,
    published: v.published,
    source: v.source,
    placements: v.placements.map((p) => ({
      id: p.id,
      section: p.section,
      projectId: p.projectId,
      order: p.order,
      active: p.active,
    })),
  }));

  return (
    <div>
      <div className="border-b border-limestone-300 pb-6">
        <h1 className="text-3xl">Video Library</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-ink-soft">
          Videos from your YouTube channel arrive here on their own. New ones stay unpublished until you publish them and
          choose where they appear. Videos play through YouTube&apos;s player; nothing is uploaded to this site.
        </p>
      </div>

      <VideoLibrary
        sync={{
          channelId: state?.channelId ?? null,
          channelTitle: state?.channelTitle ?? null,
          lastSyncedAt: state?.lastSyncedAt?.toISOString() ?? null,
          lastError: state?.lastError ?? null,
          lastImported: state?.lastImported ?? 0,
          usesApi: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
        }}
        videos={library}
        projects={projects.map((p) => ({ id: p.id, name: p.name, category: p.category }))}
      />
    </div>
  );
}
