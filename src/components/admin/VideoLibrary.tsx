"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import type { VideoSection } from "@prisma/client";
import {
  addVideoByLink,
  movePlacement,
  saveYouTubeChannel,
  setPlacementActive,
  setVideoPlacement,
  setVideoPublished,
  syncYouTubeNow,
} from "@/app/admin/(dashboard)/videos/actions";
import { Button } from "@/components/ui/Button";
import { GENERIC_ERROR, useAdminAction, useAdminToast } from "@/components/admin/AdminToaster";
import { cn } from "@/lib/utils";

export interface LibraryPlacement {
  id: string;
  section: VideoSection;
  projectId: string | null;
  order: number;
  active: boolean;
}

export interface LibraryVideo {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  durationSeconds: number | null;
  published: boolean;
  source: string;
  placements: LibraryPlacement[];
}

interface SyncInfo {
  channelId: string | null;
  channelTitle: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  lastImported: number;
  usesApi: boolean;
}

interface ProjectOption {
  id: string;
  name: string;
  category: string;
}

const SECTION_LABEL: Record<Exclude<VideoSection, "project">, string> = {
  homepage_hero: "Homepage hero",
  testimonials: "Client reviews",
  about: "About Us",
};

const inputClass =
  "w-full rounded border border-limestone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-garden-500";

const thumb = (v: Pick<LibraryVideo, "youtubeId" | "thumbnailUrl">) => v.thumbnailUrl ?? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;

function formatDuration(s: number | null) {
  if (s === null) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function VideoLibrary({ sync, videos, projects }: { sync: SyncInfo; videos: LibraryVideo[]; projects: ProjectOption[] }) {
  const [tab, setTab] = useState<"library" | "placements">("library");
  const placedCount = videos.reduce((n, v) => n + v.placements.length, 0);

  return (
    <div className="mt-8 space-y-8">
      <SyncPanel sync={sync} />

      <div className="flex gap-1 border-b border-limestone-300">
        {(
          [
            ["library", `Library (${videos.length})`],
            ["placements", `Where videos appear (${placedCount})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === key ? "border-garden-500 text-garden-700" : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "library" ? <LibraryList videos={videos} projects={projects} /> : <PlacementsBoard videos={videos} projects={projects} />}
    </div>
  );
}

// --- Channel & sync ---

function SyncPanel({ sync }: { sync: SyncInfo }) {
  const toast = useAdminToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(!sync.channelId);
  const [channel, setChannel] = useState("");
  const [link, setLink] = useState("");

  function call(fn: () => Promise<{ error?: string; message?: string }>, after?: () => void) {
    start(async () => {
      try {
        const result = await fn();
        if (result.error) toast.error(result.error);
        else {
          if (result.message) toast.success(result.message);
          after?.();
        }
      } catch (error) {
        console.error(error);
        toast.error(GENERIC_ERROR);
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-limestone-300 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg">YouTube channel</h2>
            {sync.channelId && !editing ? (
              <p className="mt-1 text-sm text-ink">
                {sync.channelTitle ?? "Your channel"} <span className="font-mono text-xs text-ink-soft">{sync.channelId}</span>
                <button type="button" onClick={() => setEditing(true)} className="ml-2 text-xs font-medium text-garden-700 hover:underline">
                  Change
                </button>
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">Paste your channel link, @handle or channel ID once.</p>
            )}
          </div>
          {sync.channelId && (
            <Button type="button" size="sm" disabled={pending} onClick={() => call(syncYouTubeNow)}>
              {pending ? "Syncing…" : "Sync now"}
            </Button>
          )}
        </div>

        {editing && (
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              call(() => saveYouTubeChannel(channel), () => setEditing(false));
            }}
          >
            <input
              id="yt-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className={inputClass}
              placeholder="https://www.youtube.com/@yourchannel"
              required
            />
            <Button type="submit" size="sm" disabled={pending || !channel.trim()}>
              {pending ? "Saving…" : "Save & import"}
            </Button>
          </form>
        )}

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-soft">Last sync</dt>
            <dd className="text-ink">{timeAgo(sync.lastSyncedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">New in last sync</dt>
            <dd className="text-ink">{sync.lastImported}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Source</dt>
            <dd className="text-ink">{sync.usesApi ? "YouTube API (full history)" : "Channel feed (latest 15)"}</dd>
          </div>
        </dl>
        {sync.lastError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Last sync failed: {sync.lastError}</p>
        )}
        <p className="mt-3 text-xs text-ink-soft">
          New uploads are picked up automatically: when someone visits the homepage (at most every 30 minutes), when you
          open this page, and once a day.
        </p>
      </div>

      <form
        className="rounded-xl border border-limestone-300 bg-white p-5 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          call(() => addVideoByLink(link), () => setLink(""));
        }}
      >
        <h2 className="text-lg">Add a video by link</h2>
        <p className="mt-1 text-xs text-ink-soft">
          For unlisted videos, or older ones the channel feed doesn&apos;t list. Not needed for new uploads.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="yt-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className={inputClass}
            placeholder="https://youtu.be/…"
            required
          />
          <Button type="submit" size="sm" variant="ghost" disabled={pending || !link.trim()}>
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- Library list ---

type Filter = "all" | "new" | "published" | "unpublished";

function LibraryList({ videos, projects }: { videos: LibraryVideo[]; projects: ProjectOption[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const isNew = (v: LibraryVideo) => !v.published && v.placements.length === 0;
  const counts = {
    all: videos.length,
    new: videos.filter(isNew).length,
    published: videos.filter((v) => v.published).length,
    unpublished: videos.filter((v) => !v.published).length,
  };
  const shown = videos.filter(
    (v) =>
      (filter === "all" || (filter === "new" ? isNew(v) : filter === "published" ? v.published : !v.published)) &&
      v.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "unpublished", "published"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1 text-sm font-medium capitalize transition-colors",
                filter === f ? "border-garden-500 bg-garden-500 text-white" : "border-limestone-300 bg-white text-ink hover:border-garden-500"
              )}
            >
              {f} <span className="opacity-75">{counts[f]}</span>
            </button>
          ))}
        </div>
        <input
          id="yt-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles"
          className={cn(inputClass, "sm:w-64")}
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-limestone-300 bg-limestone-100 px-4 py-10 text-center text-sm text-ink-soft">
          {videos.length === 0
            ? "No videos yet. Set your channel above — its videos are imported right away."
            : "No videos match this filter."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((video) => (
            <VideoRow
              key={video.id}
              video={video}
              projects={projects}
              isNew={isNew(video)}
              open={openId === video.id}
              onToggle={() => setOpenId((id) => (id === video.id ? null : video.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function placementLabel(p: LibraryPlacement, projects: ProjectOption[]) {
  return p.section === "project" ? (projects.find((x) => x.id === p.projectId)?.name ?? "Project") : SECTION_LABEL[p.section];
}

function VideoRow({
  video,
  projects,
  isNew,
  open,
  onToggle,
}: {
  video: LibraryVideo;
  projects: ProjectOption[];
  isNew: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const { run, isPending } = useAdminAction();
  const duration = formatDuration(video.durationSeconds);

  return (
    <li className="overflow-hidden rounded-xl border border-limestone-300 bg-white shadow-card">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-black sm:w-48"
          title="Watch on YouTube"
        >
          <Image src={thumb(video)} alt="" fill sizes="192px" className="object-cover" />
          {duration && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 text-[11px] font-medium text-white">{duration}</span>
          )}
        </a>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isNew && <span className="rounded-full bg-brass px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                video.published ? "bg-garden-100 text-garden-700" : "bg-limestone-200 text-ink-soft"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", video.published ? "bg-garden-500" : "bg-ink-soft/50")} />
              {video.published ? "Published" : "Unpublished"}
            </span>
            <span className="text-xs text-ink-soft">
              {formatDate(video.publishedAt)}
              {video.source === "manual" && " · added by link"}
            </span>
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-base font-medium text-ink">{video.title}</h3>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {video.placements.length === 0 ? (
              <span className="text-xs text-ink-soft">Not placed anywhere yet</span>
            ) : (
              video.placements.map((p) => (
                <span
                  key={p.id}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    p.active ? "border-garden-300 text-garden-700" : "border-limestone-300 text-ink-soft line-through"
                  )}
                >
                  {placementLabel(p, projects)}
                </span>
              ))
            )}
          </div>
          {!video.published && video.placements.length > 0 && (
            <p className="mt-2 text-xs text-brass-dark">Placed but not live — publish it to show it on the site.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Button
            type="button"
            size="sm"
            variant={video.published ? "ghost" : "primary"}
            disabled={isPending}
            onClick={() => run(() => setVideoPublished(video.id, !video.published), video.published ? "Video unpublished." : "Video published.")}
          >
            {video.published ? "Unpublish" : "Publish"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onToggle} aria-expanded={open}>
            {open ? "Close" : "Placements"}
          </Button>
        </div>
      </div>

      {open && <PlacementEditor video={video} projects={projects} />}
    </li>
  );
}

function PlacementEditor({ video, projects }: { video: LibraryVideo; projects: ProjectOption[] }) {
  const { run, isPending } = useAdminAction();
  const has = (section: VideoSection, projectId: string | null = null) =>
    video.placements.some((p) => p.section === section && (section !== "project" || p.projectId === projectId));
  const toggle = (section: VideoSection, projectId: string | null = null) =>
    run(() => setVideoPlacement(video.id, section, projectId, !has(section, projectId)));

  const groups = [
    { label: "Land projects", items: projects.filter((p) => p.category === "land_plot") },
    { label: "Apartment projects", items: projects.filter((p) => p.category !== "land_plot") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="border-t border-limestone-300 bg-limestone-100/70 p-4">
      <p className="text-sm font-medium text-ink">Show this video on:</p>
      <div className="mt-3 grid gap-5 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-2">
          {(Object.keys(SECTION_LABEL) as (keyof typeof SECTION_LABEL)[]).map((section) => (
            <label key={section} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={has(section)}
                disabled={isPending}
                onChange={() => toggle(section)}
                className="mt-0.5 h-4 w-4 accent-garden-500"
              />
              <span>
                {SECTION_LABEL[section]}
                {section === "homepage_hero" && (
                  <span className="block text-xs text-ink-soft">
                    One video only — replaces the current one. Switch Homepage Hero to &quot;YouTube video&quot; to show it.
                  </span>
                )}
                {section === "testimonials" && <span className="block text-xs text-ink-soft">Video reviews on the homepage.</span>}
              </span>
            </label>
          ))}
        </div>
        <div className="space-y-3">
          {groups.map((group) => (
            <fieldset key={group.label}>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{group.label}</legend>
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {group.items.map((project) => (
                  <label key={project.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={has("project", project.id)}
                      disabled={isPending}
                      onChange={() => toggle("project", project.id)}
                      className="h-4 w-4 accent-garden-500"
                    />
                    <span className="truncate">{project.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Placements board: order and active state per section ---

function PlacementsBoard({ videos, projects }: { videos: LibraryVideo[]; projects: ProjectOption[] }) {
  const groups = useMemo(() => {
    const rows = videos.flatMap((video) => video.placements.map((placement) => ({ video, placement })));
    const keyOf = (p: LibraryPlacement) => (p.section === "project" ? `project:${p.projectId}` : p.section);
    const map = new Map<string, { title: string; hint?: string; rows: typeof rows }>();
    const order = [
      ...(Object.keys(SECTION_LABEL) as (keyof typeof SECTION_LABEL)[]),
      ...projects.map((p) => `project:${p.id}`),
    ];
    for (const key of order) {
      const list = rows.filter((r) => keyOf(r.placement) === key).sort((a, b) => a.placement.order - b.placement.order);
      if (list.length === 0) continue;
      const project = key.startsWith("project:") ? projects.find((p) => `project:${p.id}` === key) : null;
      map.set(key, {
        title: project ? project.name : SECTION_LABEL[key as keyof typeof SECTION_LABEL],
        hint: project ? (project.category === "land_plot" ? "Land project · video showcase" : "Apartment project · video showcase") : undefined,
        rows: list,
      });
    }
    return [...map.entries()];
  }, [videos, projects]);

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-limestone-300 bg-limestone-100 px-4 py-10 text-center text-sm text-ink-soft">
        No video is placed yet. Open a video&apos;s <strong>Placements</strong> in the Library tab to choose where it appears.
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {groups.map(([key, group]) => (
        <section key={key} className="rounded-xl border border-limestone-300 bg-white p-4 shadow-card">
          <h3 className="text-base font-medium text-ink">{group.title}</h3>
          {group.hint && <p className="text-xs text-ink-soft">{group.hint}</p>}
          <ol className="mt-3 space-y-2">
            {group.rows.map(({ video, placement }, index) => (
              <PlacementRow key={placement.id} video={video} placement={placement} index={index} total={group.rows.length} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function PlacementRow({
  video,
  placement,
  index,
  total,
}: {
  video: LibraryVideo;
  placement: LibraryPlacement;
  index: number;
  total: number;
}) {
  const { run, isPending } = useAdminAction();
  const live = placement.active && video.published;
  const arrow = "rounded px-1.5 py-0.5 text-sm text-ink-soft hover:bg-limestone-200 hover:text-ink disabled:opacity-30";

  return (
    <li className="flex items-center gap-3 rounded-lg border border-limestone-300 p-2">
      <span className="w-5 text-center text-xs font-semibold text-ink-soft">{index + 1}</span>
      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded bg-black">
        <Image src={thumb(video)} alt="" fill sizes="80px" className={cn("object-cover", !live && "opacity-50")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{video.title}</p>
        <p className="text-xs text-ink-soft">
          {live ? "Showing" : !video.published ? "Video unpublished" : "Deactivated"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label="Move up" disabled={isPending || index === 0} onClick={() => run(() => movePlacement(placement.id, "up"))} className={arrow}>
          ↑
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={isPending || index === total - 1}
          onClick={() => run(() => movePlacement(placement.id, "down"))}
          className={arrow}
        >
          ↓
        </button>
        <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft" title="Active">
          <input
            type="checkbox"
            checked={placement.active}
            disabled={isPending}
            onChange={() => run(() => setPlacementActive(placement.id, !placement.active))}
            className="h-4 w-4 accent-garden-500"
          />
          Active
        </label>
      </div>
    </li>
  );
}
