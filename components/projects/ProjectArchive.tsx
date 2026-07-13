"use client";

import { ArrowUpRight, Code2, FileCode2, FolderOpen, Globe2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { links } from "@/data/links";
import type { LinkId } from "@/data/links";
import { projects } from "@/data/projects";
import type { ProjectEntry } from "@/lib/content-types";

import { Tag } from "../ui/Tag";
import { Window } from "../ui/Window";

export function ProjectArchive() {
  const [selectedId, setSelectedId] = useState<string>(projects[0].id);
  const selected: ProjectEntry<LinkId> = projects.find((project) => project.id === selectedId) ?? projects[0];

  return (
    <Window title="projects.folder" eyebrow={`${String(projects.length).padStart(2, "0")} items`}>
      <div className="grid min-h-[38rem] lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="border-b border-[var(--line)] bg-[var(--panel-soft)] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-[var(--quiet)]">
            <FolderOpen aria-hidden="true" className="size-3.5 text-[var(--accent)]" />
            things_that_became_real/
          </div>
          <div className="soft-scrollbar max-h-[27rem] overflow-auto p-2 lg:max-h-none">
            {projects.map((project, index) => {
              const active = project.id === selected.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  aria-pressed={active}
                  className={`grid min-h-20 w-full grid-cols-[2rem_1fr] gap-2 border px-3 py-3 text-left transition-colors ${
                    active
                      ? "border-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel))]"
                      : "border-transparent hover:border-[var(--line)] hover:bg-[var(--panel-raised)]"
                  }`}
                >
                  <span className={`font-mono text-[9px] ${active ? "text-[var(--accent)]" : "text-[var(--quiet)]"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong className="block text-xs font-semibold text-[var(--ink)]">{project.name}</strong>
                    <span className="mt-1 block font-mono text-[9px] text-[var(--quiet)]">{project.status}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--line)] p-3 font-mono text-[9px] leading-4 text-[var(--quiet)]">
            no stars, download counts, or user numbers stored.
          </div>
        </div>

        <div className="min-w-0">
          <div className="checkerboard relative min-h-64 border-b border-[var(--line)] sm:min-h-80">
            <Image
              key={selected.screenshot.src}
              src={selected.screenshot.src}
              alt={selected.screenshot.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover"
            />
            {selected.screenshot.placeholder ? (
              <span className="absolute left-3 top-3 border border-[var(--warning)] bg-[var(--panel)] px-2 py-1 font-mono text-[9px] uppercase text-[var(--warning)]">
                screenshot placeholder
              </span>
            ) : null}
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Tag tone={selected.status === "online" ? "signal" : "default"}>{selected.status}</Tag>
                  {selected.featured ? <Tag tone="accent">featured file</Tag> : null}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{selected.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{selected.shortDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.liveLinkId ? (
                  <a
                    href={links[selected.liveLinkId].url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 items-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--canvas-deep)]"
                  >
                    <Globe2 aria-hidden="true" className="size-3.5" /> open live
                    <ArrowUpRight aria-hidden="true" className="size-3" />
                  </a>
                ) : null}
                {selected.repositoryLinkId ? (
                  <a
                    href={links[selected.repositoryLinkId].url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 items-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-4 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
                  >
                    <Code2 aria-hidden="true" className="size-3.5" /> source
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <h3 className="pixel-label text-[var(--ink)]">possible features from brief</h3>
                <ul className="mt-4 space-y-2">
                  {selected.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-xs leading-5 text-[var(--muted)]">
                      <span className="mt-2 size-1 shrink-0 bg-[var(--signal)]" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <dl className="border border-[var(--line)] bg-[var(--panel-soft)] font-mono text-[10px]">
                <div className="grid grid-cols-[7rem_1fr] border-b border-[var(--line)] px-3 py-2.5">
                  <dt className="text-[var(--quiet)]">year</dt>
                  <dd className="text-[var(--muted)]">{selected.year ?? "not provided"}</dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] border-b border-[var(--line)] px-3 py-2.5">
                  <dt className="text-[var(--quiet)]">technology</dt>
                  <dd className="text-[var(--muted)]">{selected.technologies.length ? selected.technologies.join(", ") : "not provided"}</dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] border-b border-[var(--line)] px-3 py-2.5">
                  <dt className="text-[var(--quiet)]">open source</dt>
                  <dd className="text-[var(--muted)]">{selected.openSource === null ? "not provided" : selected.openSource ? "yes" : "no"}</dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] px-3 py-2.5">
                  <dt className="text-[var(--quiet)]">tags</dt>
                  <dd className="text-[var(--muted)]">{selected.tags.join(" / ")}</dd>
                </div>
              </dl>
            </div>

            {selected.developmentNote ? (
              <p className="mt-5 flex gap-3 border-l-2 border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_5%,transparent)] p-3 font-mono text-[9px] leading-4 text-[var(--quiet)]">
                <FileCode2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--warning)]" />
                {selected.developmentNote}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Window>
  );
}
