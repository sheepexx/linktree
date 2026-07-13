"use client";

import { ArrowUpRight, Bookmark, Folder, Link as LinkIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { linkDirectoryOrder, links, type LinkId } from "@/data/links";
import type { LinkCategory } from "@/lib/content-types";

import { PixelButton } from "../ui/PixelButton";
import { Tag } from "../ui/Tag";
import { Window } from "../ui/Window";

type Filter = "all" | LinkCategory;

const categories: readonly Filter[] = ["all", "main", "art", "osu!", "videos", "development", "social"];

export function LinkDirectory() {
  const [filter, setFilter] = useState<Filter>("all");

  const visibleLinks = useMemo(
    () =>
      linkDirectoryOrder
        .map((id) => [id, links[id]] as const)
        .filter(([, entry]) => filter === "all" || entry.category === filter),
    [filter],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <Window
        title="bookmarks.directory"
        eyebrow={`${String(visibleLinks.length).padStart(2, "0")} entries`}
      >
        <div className="flex flex-wrap gap-2 border-b border-[var(--line)] p-3" aria-label="Filter links by category">
          {categories.map((category) => (
            <PixelButton key={category} active={filter === category} onClick={() => setFilter(category)}>
              {category}
            </PixelButton>
          ))}
        </div>

        <ul className="divide-y divide-[var(--line)]">
          {visibleLinks.map(([id, entry], index) => (
            <li key={id}>
              <a
                href={entry.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group grid min-h-24 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-[var(--panel-raised)] sm:gap-5 sm:px-5"
              >
                <span
                  className="grid size-11 place-items-center border bg-[var(--canvas-deep)] shadow-[2px_2px_0_var(--shadow)]"
                  style={{ borderColor: entry.accentColor, color: entry.accentColor }}
                >
                  {entry.featured ? (
                    <Bookmark aria-hidden="true" className="size-4" />
                  ) : (
                    <LinkIcon aria-hidden="true" className="size-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <strong className="text-sm font-semibold text-[var(--ink)]">{entry.platform}</strong>
                    {entry.featured ? <Tag tone="accent">pinned</Tag> : null}
                  </span>
                  <span className="block text-xs leading-5 text-[var(--muted)]">{entry.description}</span>
                  <span className="mt-1 block truncate font-mono text-[9px] text-[var(--quiet)]">
                    {entry.username ? `@${entry.username} // ` : ""}{entry.category}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="hidden font-mono text-[9px] text-[var(--quiet)] sm:inline">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-[var(--quiet)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Window>

      <aside className="space-y-5">
        <Window title="folders.idx" eyebrow="sort">
          <div className="p-3">
            {categories.slice(1).map((category) => {
              const count = linkDirectoryOrder.filter((id: LinkId) => links[id].category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  aria-pressed={filter === category}
                  className="flex min-h-10 w-full items-center gap-3 border-b border-[var(--line)] px-2 text-left font-mono text-[10px] text-[var(--muted)] last:border-b-0 hover:bg-[var(--panel-raised)] hover:text-[var(--ink)]"
                >
                  <Folder aria-hidden="true" className="size-3.5 text-[var(--accent)]" />
                  <span className="flex-1">{category}/</span>
                  <span className="text-[var(--quiet)]">{String(count).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
        </Window>

        <div className="border border-dashed border-[var(--line-bright)] bg-[var(--panel-soft)] p-4 font-mono text-[10px] leading-5 text-[var(--quiet)]">
          links are maintained manually. no follower counts, timelines, or tracking widgets are loaded here.
        </div>
      </aside>
    </div>
  );
}
