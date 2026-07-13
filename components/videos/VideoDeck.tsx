"use client";

import { ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import {
  type KeyboardEvent,
  useId,
  useRef,
  useState,
} from "react";

import { links, mediaEmbedOrigins, type LinkId } from "@/data/links";
import { videos } from "@/data/videos";
import type { VideoEntry, VideoPlatform } from "@/lib/content-types";

import { Window } from "../ui/Window";

const videoLibrary: readonly VideoEntry<LinkId>[] = videos;

function youtubeVideoId(url: URL) {
  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

  if (hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (hostname !== "youtube.com" && hostname !== "m.youtube.com") {
    return null;
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v");
  }

  const [kind, id] = url.pathname.split("/").filter(Boolean);
  return kind === "shorts" || kind === "live" || kind === "embed"
    ? (id ?? null)
    : null;
}

function getEmbedUrl(platform: VideoPlatform, sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);

    if (platform === "YouTube") {
      const videoId = youtubeVideoId(url);
      if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;

      return `${mediaEmbedOrigins.youtubePrivacy}${videoId}?autoplay=0`;
    }

    if (platform === "Bilibili") {
      const match = url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
      if (!match?.[1]) return null;

      return `${mediaEmbedOrigins.bilibiliPlayer}?bvid=${encodeURIComponent(match[1])}&autoplay=0`;
    }
  } catch {
    return null;
  }

  return null;
}

function detailValue(value: string | null) {
  return value ?? "not added";
}

export function VideoDeck() {
  const playerId = useId();
  const playlistTitleId = useId();
  const selectionStatusId = useId();
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const [selectedId, setSelectedId] = useState<string | null>(
    videoLibrary[0]?.id ?? null,
  );
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const selected =
    videoLibrary.find((video) => video.id === selectedId) ??
    videoLibrary[0] ??
    null;

  const selectVideo = (videoId: string, focus = false) => {
    setSelectedId(videoId);
    setLoadedId(null);

    if (focus) {
      window.requestAnimationFrame(() => rowRefs.current.get(videoId)?.focus());
    }
  };

  const handlePlaylistKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (index + 1) % videoLibrary.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (index - 1 + videoLibrary.length) % videoLibrary.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = videoLibrary.length - 1;
    }

    if (nextIndex === null) return;

    const nextVideo = videoLibrary[nextIndex];
    if (!nextVideo) return;

    event.preventDefault();
    selectVideo(nextVideo.id, true);
  };

  if (!selected) {
    return (
      <Window title="videos.player" eyebrow="playlist offline">
        <div className="p-6 text-sm text-[var(--muted)]">
          No video entries have been added yet.
        </div>
      </Window>
    );
  }

  const channelLink = links[selected.channelLinkId];
  const sourceLink = selected.externalLinkId
    ? links[selected.externalLinkId]
    : null;
  const embedUrl = sourceLink
    ? getEmbedUrl(selected.platform, sourceLink.url)
    : null;
  const isPlayerLoaded = Boolean(embedUrl && loadedId === selected.id);

  return (
    <Window
      title="videos.player"
      eyebrow="manual playlist"
      aria-label="Video playlist and media preview"
      className="overflow-hidden"
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          <div className="flex min-h-9 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em]">
            <span className="text-[var(--quiet)]">media preview</span>
            <span
              id={selectionStatusId}
              aria-live="polite"
              className="truncate text-right text-[var(--muted)]"
            >
              {isPlayerLoaded ? "player loaded" : "no media loaded"}
            </span>
          </div>

          <div
            id={playerId}
            aria-describedby={selectionStatusId}
            className="checkerboard relative aspect-video overflow-hidden border-b border-[var(--line)] bg-[var(--canvas-deep)]"
          >
            {isPlayerLoaded && embedUrl ? (
              <iframe
                src={embedUrl}
                title={`Video player: ${selected.title}`}
                loading="lazy"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 size-full border-0 bg-black"
              />
            ) : (
              <>
                <Image
                  key={selected.thumbnail.src}
                  src={selected.thumbnail.src}
                  alt={selected.thumbnail.alt}
                  fill
                  priority={false}
                  sizes="(max-width: 1023px) 100vw, 70vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_56%,color-mix(in_srgb,var(--canvas-deep)_92%,transparent))]" />
                <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="max-w-[34rem] border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas-deep)_92%,transparent)] px-3 py-2">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      {selected.thumbnail.placeholder
                        ? "thumbnail placeholder"
                        : "thumbnail preview"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {sourceLink
                        ? "The external video is not loaded until you choose it below."
                        : "No video source is attached to this entry."}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border-b border-[var(--line)] bg-[var(--panel-raised)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              {sourceLink && embedUrl && !isPlayerLoaded ? (
                <button
                  type="button"
                  onClick={() => setLoadedId(selected.id)}
                  className="inline-flex min-h-10 items-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--canvas-deep)] hover:bg-[var(--ink)]"
                >
                  <Play aria-hidden="true" className="size-3.5" fill="currentColor" />
                  load video
                </button>
              ) : null}

              {isPlayerLoaded ? (
                <button
                  type="button"
                  onClick={() => setLoadedId(null)}
                  className="min-h-10 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
                >
                  unload player
                </button>
              ) : null}

              {sourceLink ? (
                <a
                  href={sourceLink.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-10 items-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
                >
                  open video
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              ) : (
                <p className="font-mono text-[8px] leading-4 text-[var(--quiet)]">
                  video actions appear only after a source link is added
                </p>
              )}
            </div>
          </div>

          <article className="p-4 sm:p-5" aria-labelledby={`${playerId}-title`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 max-w-2xl">
                <div className="flex flex-wrap gap-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.1em]">
                  <span className="border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 text-[var(--muted)]">
                    {selected.platform}
                  </span>
                  <span
                    className={`border px-2 py-1 ${
                      selected.status === "placeholder"
                        ? "border-[var(--warning)] text-[var(--warning)]"
                        : "border-[var(--signal-soft)] text-[var(--signal)]"
                    }`}
                  >
                    {selected.status}
                  </span>
                  {selected.featured ? (
                    <span className="border border-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
                      featured
                    </span>
                  ) : null}
                </div>

                <h2
                  id={`${playerId}-title`}
                  className="mt-3 text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl"
                >
                  {selected.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {selected.description}
                </p>
              </div>

              <a
                href={channelLink.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                {channelLink.platform} channel
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            </div>

            <dl className="mt-5 grid border-l border-t border-[var(--line)] font-mono text-[9px] sm:grid-cols-3">
              {[
                ["category", selected.category],
                ["upload date", detailValue(selected.uploadDate)],
                ["duration", detailValue(selected.duration)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 border-b border-r border-[var(--line)] bg-[var(--panel-soft)] p-3"
                >
                  <dt className="uppercase tracking-[0.12em] text-[var(--quiet)]">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-[var(--muted)]">{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>

        <aside className="min-w-0 bg-[var(--panel)]" aria-labelledby={playlistTitleId}>
          <div className="border-b border-[var(--line)] bg-[var(--panel-raised)] px-3 py-3">
            <h2
              id={playlistTitleId}
              className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]"
            >
              local playlist
            </h2>
            <p className="mt-1 font-mono text-[8px] leading-4 text-[var(--quiet)]">
              thumbnails and metadata from the local archive
            </p>
          </div>

          <ul className="soft-scrollbar max-h-[32rem] overflow-y-auto p-2 lg:max-h-[47rem]">
            {videoLibrary.map((video, index) => {
              const active = video.id === selected.id;

              return (
                <li key={video.id} className="mb-1 last:mb-0">
                  <button
                    ref={(node) => {
                      if (node) rowRefs.current.set(video.id, node);
                      else rowRefs.current.delete(video.id);
                    }}
                    type="button"
                    aria-pressed={active}
                    aria-controls={playerId}
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectVideo(video.id)}
                    onKeyDown={(event) => handlePlaylistKeyDown(event, index)}
                    className={`grid min-h-20 w-full grid-cols-[5.75rem_minmax(0,1fr)] gap-3 border p-2 text-left transition-colors ${
                      active
                        ? "border-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel))]"
                        : "border-transparent bg-[var(--panel-soft)] hover:border-[var(--line)] hover:bg-[var(--panel-raised)]"
                    }`}
                  >
                    <span className="relative aspect-video overflow-hidden border border-[var(--line)] bg-[var(--canvas-deep)]">
                      <Image
                        src={video.thumbnail.src}
                        alt=""
                        fill
                        sizes="92px"
                        className="object-cover"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 right-1 bg-[var(--canvas-deep)] px-1 font-mono text-[7px] text-[var(--quiet)]"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </span>

                    <span className="min-w-0 self-center">
                      <strong className="block truncate text-xs font-semibold text-[var(--ink)]">
                        {video.title}
                      </strong>
                      <span className="mt-1 block truncate font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--muted)]">
                        {video.platform} / {video.category}
                      </span>
                      <span
                        className={`mt-1 block font-mono text-[8px] uppercase tracking-[0.08em] ${
                          video.status === "placeholder"
                            ? "text-[var(--warning)]"
                            : "text-[var(--signal)]"
                        }`}
                      >
                        {video.status}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="border-t border-[var(--line)] px-3 py-2 font-mono text-[8px] leading-4 text-[var(--quiet)]">
            use arrow keys, home, or end to move through the playlist
          </p>
        </aside>
      </div>
    </Window>
  );
}

export default VideoDeck;
