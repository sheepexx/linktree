"use client";

import {
  FolderTree,
  Grid3X3,
  List as ListIcon,
} from "lucide-react";
import Image from "next/image";
import {
  type KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { gfxEntries } from "@/data/gfx";
import { links, type LinkId } from "@/data/links";
import type { GfxEntry, GfxView } from "@/lib/content-types";

import { EmptyState } from "@/components/ui/EmptyState";

const archiveEntries: readonly GfxEntry[] = gfxEntries;

const viewOptions: readonly {
  id: GfxView;
  label: string;
  icon: typeof Grid3X3;
}[] = [
  { id: "thumbnail", label: "Thumbnails", icon: Grid3X3 },
  { id: "list", label: "List", icon: ListIcon },
  { id: "file-browser", label: "Files", icon: FolderTree },
];

type TypeFilter = GfxEntry["type"] | "all";
type StatusFilter = GfxEntry["status"] | "all";

function isLinkId(value: string): value is LinkId {
  return Object.prototype.hasOwnProperty.call(links, value);
}

function displayValue(value: string | null) {
  return value?.trim() ? value : "not recorded";
}

function PlaceholderFlag({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`border border-[var(--warning)] bg-[var(--canvas-deep)] font-mono font-bold uppercase tracking-[0.12em] text-[var(--warning)] ${
        compact ? "px-1.5 py-1 text-[8px]" : "px-2 py-1 text-[9px]"
      }`}
    >
      placeholder
    </span>
  );
}

type EntryButtonProps = {
  entry: GfxEntry;
  selected: boolean;
  register: (node: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

function ThumbnailEntry({
  entry,
  selected,
  register,
  onSelect,
  onKeyDown,
}: EntryButtonProps) {
  return (
    <button
      ref={register}
      type="button"
      aria-pressed={selected}
      aria-label={`Select ${entry.fileName}`}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`group min-w-0 border bg-[var(--panel-soft)] p-1.5 text-left transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-[var(--line-bright)] hover:bg-[var(--panel-raised)] motion-reduce:transform-none motion-reduce:transition-none ${
        selected
          ? "border-[var(--accent)] bg-[var(--panel-raised)] shadow-[3px_3px_0_var(--shadow)]"
          : "border-[var(--line)]"
      }`}
    >
      <span className="checkerboard relative block aspect-square overflow-hidden border border-[var(--line)]">
        <Image
          src={entry.previewImage.src}
          alt={entry.previewImage.alt}
          fill
          sizes="(max-width: 639px) 42vw, (max-width: 1023px) 28vw, 18vw"
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        {entry.previewImage.placeholder ? (
          <span className="absolute left-1.5 top-1.5">
            <PlaceholderFlag compact />
          </span>
        ) : null}
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 h-px ${
            selected ? "bg-[var(--accent)]" : "bg-[var(--line-bright)]"
          }`}
        />
      </span>
      <span className="block px-1 pb-1 pt-2">
        <span className="block truncate font-mono text-[10px] font-semibold text-[var(--ink)]">
          {entry.fileName}
        </span>
        <span className="mt-1 flex min-w-0 items-center justify-between gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--quiet)]">
          <span className="truncate">{entry.type}</span>
          <span className="shrink-0">{entry.version ?? "—"}</span>
        </span>
      </span>
    </button>
  );
}

function ListEntry({
  entry,
  selected,
  register,
  onSelect,
  onKeyDown,
}: EntryButtonProps) {
  return (
    <button
      ref={register}
      type="button"
      aria-pressed={selected}
      aria-label={`Select ${entry.fileName}`}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`group grid min-h-16 w-full grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 border-b px-2 py-2 text-left transition-colors last:border-b-0 hover:bg-[var(--panel-raised)] sm:grid-cols-[3.25rem_minmax(0,1fr)_9rem_7rem] ${
        selected
          ? "border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel-raised))]"
          : "border-[var(--line)] bg-[var(--panel-soft)]"
      }`}
    >
      <span className="checkerboard relative block aspect-square overflow-hidden border border-[var(--line)]">
        <Image
          src={entry.previewImage.src}
          alt=""
          fill
          sizes="52px"
          className="object-cover"
        />
        {entry.previewImage.placeholder ? (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 size-2 border-b border-l border-[var(--warning)] bg-[var(--canvas-deep)]"
          />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-[11px] font-semibold text-[var(--ink)]">
          {entry.fileName}
        </span>
        <span className="mt-1 block truncate text-xs text-[var(--muted)]">
          {entry.title}
        </span>
        <span className="mt-1 flex gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--quiet)] sm:hidden">
          <span className="truncate">{entry.type}</span>
          <span aria-hidden="true">/</span>
          <span className="truncate">{entry.status}</span>
        </span>
      </span>
      <span className="hidden truncate font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--muted)] sm:block">
        {entry.type}
      </span>
      <span className="hidden truncate font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--quiet)] sm:block">
        {entry.status}
      </span>
    </button>
  );
}

function FileEntry({
  entry,
  selected,
  register,
  onSelect,
  onKeyDown,
}: EntryButtonProps) {
  return (
    <button
      ref={register}
      type="button"
      aria-pressed={selected}
      aria-label={`Select ${entry.fileName}`}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`grid min-h-10 w-full grid-cols-[minmax(10rem,1fr)_8.5rem_7rem_6.5rem] items-center border-b border-[var(--line)] px-2 text-left font-mono text-[9px] last:border-b-0 hover:bg-[var(--panel-raised)] ${
        selected
          ? "bg-[var(--accent)] text-[var(--canvas-deep)]"
          : "bg-[var(--panel-soft)] text-[var(--muted)]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 border ${
            selected
              ? "border-[var(--canvas-deep)] bg-[var(--canvas-deep)]"
              : entry.previewImage.placeholder
                ? "border-[var(--warning)] bg-transparent"
                : "border-[var(--signal)] bg-[var(--signal)]"
          }`}
        />
        <span className="truncate font-semibold">{entry.fileName}</span>
      </span>
      <span className="truncate uppercase tracking-[0.06em]">{entry.type}</span>
      <span className="truncate uppercase tracking-[0.06em]">{entry.status}</span>
      <span className="truncate tabular-nums">{entry.date ?? "—"}</span>
    </button>
  );
}

export function GfxBrowser() {
  const browserId = useId();
  const previewTitleId = useId();
  const keyboardHelpId = useId();
  const [view, setView] = useState<GfxView>("thumbnail");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    archiveEntries[0]?.id ?? null,
  );
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  const typeOptions = useMemo(
    () =>
      [...new Set(archiveEntries.map((entry) => entry.type))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );

  const statusOptions = useMemo(
    () =>
      [...new Set(archiveEntries.map((entry) => entry.status))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );

  const filteredEntries = useMemo(
    () =>
      archiveEntries.filter(
        (entry) =>
          (typeFilter === "all" || entry.type === typeFilter) &&
          (statusFilter === "all" || entry.status === statusFilter),
      ),
    [statusFilter, typeFilter],
  );

  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedId) ??
    filteredEntries[0] ??
    null;

  const externalSource =
    selectedEntry?.externalLinkId && isLinkId(selectedEntry.externalLinkId)
      ? links[selectedEntry.externalLinkId]
      : null;

  const selectAndFocus = (entryId: string) => {
    setSelectedId(entryId);
    window.requestAnimationFrame(() => itemRefs.current.get(entryId)?.focus());
  };

  const handleEntryKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    entryId: string,
  ) => {
    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === entryId,
    );
    if (currentIndex < 0) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % filteredEntries.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (currentIndex - 1 + filteredEntries.length) % filteredEntries.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = filteredEntries.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextEntry = filteredEntries[nextIndex];
    if (nextEntry) selectAndFocus(nextEntry.id);
  };

  const entryButtonProps = (entry: GfxEntry): EntryButtonProps => ({
    entry,
    selected: selectedEntry?.id === entry.id,
    register: (node) => {
      if (node) itemRefs.current.set(entry.id, node);
      else itemRefs.current.delete(entry.id);
    },
    onSelect: () => setSelectedId(entry.id),
    onKeyDown: (event) => handleEntryKeyDown(event, entry.id),
  });

  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <section className="window-panel overflow-hidden" aria-label="GFX archive browser">
      <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 border border-[var(--line-bright)] bg-[var(--accent)]" />
          <span className="size-2 border border-[var(--line-bright)] bg-[var(--panel)]" />
          <span className="size-2 border border-[var(--line-bright)] bg-[var(--signal-soft)]" />
        </div>
        <p className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold tracking-[0.06em] text-[var(--ink)]">
          gfx_archive.browser
        </p>
        <p
          role="status"
          aria-live="polite"
          className="font-mono text-[9px] tabular-nums text-[var(--quiet)]"
        >
          {filteredEntries.length.toString().padStart(2, "0")} / {archiveEntries.length.toString().padStart(2, "0")} files
        </p>
      </div>

      <div className="border-b border-[var(--line)] bg-[var(--panel)] p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="min-w-0">
              <span className="mb-1.5 block font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--quiet)]">
                type
              </span>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as TypeFilter)
                }
                className="min-h-10 w-full min-w-0 border border-[var(--line)] bg-[var(--panel-soft)] px-2 font-mono text-[10px] text-[var(--ink)] hover:border-[var(--line-bright)] sm:w-52"
              >
                <option value="all">all types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="mb-1.5 block font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--quiet)]">
                status
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="min-h-10 w-full min-w-0 border border-[var(--line)] bg-[var(--panel-soft)] px-2 font-mono text-[10px] text-[var(--ink)] hover:border-[var(--line-bright)] sm:w-44"
              >
                <option value="all">all statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="min-w-0">
            <legend className="mb-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--quiet)]">
              display
            </legend>
            <div className="grid grid-cols-3 border border-[var(--line)]" aria-label="Display mode">
              {viewOptions.map((option) => {
                const Icon = option.icon;
                const active = view === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    aria-controls={browserId}
                    onClick={() => setView(option.id)}
                    className={`flex min-h-10 items-center justify-center gap-2 border-r border-[var(--line)] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] last:border-r-0 hover:bg-[var(--panel-raised)] ${
                      active
                        ? "bg-[var(--accent)] text-[var(--canvas-deep)]"
                        : "bg-[var(--panel-soft)] text-[var(--muted)]"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          <div
            id={browserId}
            role="region"
            aria-label={`${viewOptions.find((option) => option.id === view)?.label} view`}
            aria-describedby={keyboardHelpId}
            className="soft-scrollbar min-h-[24rem] overflow-auto bg-[var(--canvas-deep)]"
          >
            {filteredEntries.length === 0 ? (
              <div className="p-3 sm:p-4">
                <EmptyState
                  title="no matching files"
                  description="Nothing in the local GFX data matches both filters. Clear them to return to the full archive."
                />
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mx-auto mt-3 block min-h-10 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
                >
                  clear filters
                </button>
              </div>
            ) : view === "thumbnail" ? (
              <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:p-3 xl:grid-cols-4">
                {filteredEntries.map((entry) => (
                  <ThumbnailEntry key={entry.id} {...entryButtonProps(entry)} />
                ))}
              </div>
            ) : view === "list" ? (
              <div className="p-2 sm:p-3">
                <div className="overflow-hidden border border-[var(--line)]">
                  {filteredEntries.map((entry) => (
                    <ListEntry key={entry.id} {...entryButtonProps(entry)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid min-h-[24rem] sm:grid-cols-[10.5rem_minmax(0,1fr)]">
                <nav
                  aria-label="GFX type folders"
                  className="soft-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--line)] bg-[var(--panel)] p-2 sm:block sm:overflow-visible sm:border-b-0 sm:border-r"
                >
                  <p className="hidden px-2 pb-2 pt-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--quiet)] sm:block">
                    directories
                  </p>
                  <button
                    type="button"
                    aria-pressed={typeFilter === "all"}
                    onClick={() => setTypeFilter("all")}
                    className={`flex min-h-9 shrink-0 items-center justify-between gap-3 px-2 font-mono text-[9px] sm:mb-0.5 sm:w-full ${
                      typeFilter === "all"
                        ? "bg-[var(--accent)] text-[var(--canvas-deep)]"
                        : "text-[var(--muted)] hover:bg-[var(--panel-raised)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span>../all</span>
                    <span className="tabular-nums opacity-70">{archiveEntries.length}</span>
                  </button>
                  {typeOptions.map((type) => {
                    const count = archiveEntries.filter(
                      (entry) => entry.type === type,
                    ).length;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={typeFilter === type}
                        onClick={() => setTypeFilter(type)}
                        className={`flex min-h-9 shrink-0 items-center justify-between gap-3 px-2 font-mono text-[9px] sm:mb-0.5 sm:w-full ${
                          typeFilter === type
                            ? "bg-[var(--accent)] text-[var(--canvas-deep)]"
                            : "text-[var(--muted)] hover:bg-[var(--panel-raised)] hover:text-[var(--ink)]"
                        }`}
                      >
                        <span className="truncate">/{type.toLowerCase()}</span>
                        <span className="tabular-nums opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="min-w-0 overflow-hidden">
                  <div className="flex h-9 items-center border-b border-[var(--line)] bg-[var(--panel-raised)] px-3 font-mono text-[9px] text-[var(--quiet)]">
                    <span className="text-[var(--accent)]">archive:</span>
                    <span>/gfx/{typeFilter === "all" ? "all" : typeFilter.toLowerCase()}</span>
                  </div>
                  <div className="soft-scrollbar overflow-x-auto">
                    <div className="min-w-[36rem]">
                      <div
                        aria-hidden="true"
                        className="grid h-8 grid-cols-[minmax(10rem,1fr)_8.5rem_7rem_6.5rem] items-center border-b border-[var(--line)] bg-[var(--panel)] px-2 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--quiet)]"
                      >
                        <span>name</span>
                        <span>type</span>
                        <span>status</span>
                        <span>date</span>
                      </div>
                      {filteredEntries.map((entry) => (
                        <FileEntry key={entry.id} {...entryButtonProps(entry)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-8 items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-mono text-[8px] text-[var(--quiet)]">
            <span id={keyboardHelpId}>arrow keys move selection</span>
            <span aria-hidden="true">↑ ↓ ← →</span>
          </div>
        </div>

        <aside
          aria-labelledby={selectedEntry ? previewTitleId : undefined}
          aria-label={selectedEntry ? undefined : "File inspector"}
          className="min-w-0 bg-[var(--panel)] p-3 sm:p-4"
        >
          {selectedEntry ? (
            <div>
              <div className="checkerboard relative aspect-[4/3] overflow-hidden border border-[var(--line)]">
                <Image
                  key={selectedEntry.id}
                  src={selectedEntry.fullImage.src}
                  alt={selectedEntry.fullImage.alt}
                  fill
                  sizes="(max-width: 1023px) 92vw, 336px"
                  className="object-contain"
                />
                {selectedEntry.fullImage.placeholder ? (
                  <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                    <PlaceholderFlag />
                    <span className="max-w-36 border border-[var(--line)] bg-[var(--canvas-deep)] px-2 py-1 text-right font-mono text-[8px] leading-4 text-[var(--muted)]">
                      preview only — replace this asset
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="border-x border-b border-[var(--line)] bg-[var(--panel-soft)] p-3">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--quiet)]">
                  selected file
                </p>
                <h3
                  id={previewTitleId}
                  className="mt-1 break-words text-lg font-medium tracking-tight text-[var(--ink)]"
                >
                  {selectedEntry.title}
                </h3>
                <p className="mt-1 break-all font-mono text-[9px] text-[var(--accent)]">
                  {selectedEntry.fileName}
                </p>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  {selectedEntry.description.trim()
                    ? selectedEntry.description
                    : "No description has been added to this entry."
                  }
                </p>
              </div>

              <dl className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)] font-mono text-[9px]">
                {[
                  ["type", selectedEntry.type],
                  ["status", selectedEntry.status],
                  ["date", displayValue(selectedEntry.date)],
                  ["version", displayValue(selectedEntry.version)],
                  [
                    "software",
                    selectedEntry.software.length
                      ? selectedEntry.software.join(" / ")
                      : "not recorded",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-2"
                  >
                    <dt className="uppercase tracking-[0.1em] text-[var(--quiet)]">
                      {label}
                    </dt>
                    <dd className="break-words text-[var(--muted)]">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--quiet)]">
                  tags
                </p>
                {selectedEntry.tags.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="File tags">
                    {selectedEntry.tags.map((tag) => (
                      <li
                        key={tag}
                        className="border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.06em] text-[var(--muted)]"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 font-mono text-[9px] text-[var(--quiet)]">
                    no tags added
                  </p>
                )}
              </div>

              {(externalSource || selectedEntry.downloadEnabled) ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {externalSource ? (
                    <a
                      href={externalSource.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex min-h-10 items-center justify-center border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
                    >
                      source ↗
                    </a>
                  ) : null}
                  {selectedEntry.downloadEnabled ? (
                    <a
                      href={selectedEntry.fullImage.src}
                      download={selectedEntry.fileName}
                      className="flex min-h-10 items-center justify-center border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
                    >
                      download file
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 border border-dashed border-[var(--line)] px-3 py-2 font-mono text-[8px] leading-4 text-[var(--quiet)]">
                  no external source or download is enabled for this entry
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              title="nothing selected"
              description="Choose different filters or clear the current ones to inspect a local GFX entry."
            />
          )}
        </aside>
      </div>
    </section>
  );
}

export default GfxBrowser;
