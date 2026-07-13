import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Clock3, FileImage, Folder, Radio, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ExternalAnchor } from "@/components/ui/ExternalAnchor";
import { Tag } from "@/components/ui/Tag";
import { Window } from "@/components/ui/Window";
import { artwork } from "@/data/artwork";
import { links } from "@/data/links";
import { navigation } from "@/data/navigation";
import { profile } from "@/data/profile";
import { status } from "@/data/status";

export const metadata: Metadata = {
  title: { absolute: "SHEEPEX — art, GFX, osu! and internet projects" },
  description: profile.seo.description,
  alternates: { canonical: "/" },
};

const sectionNotes = {
  art: "finished, unfinished, and empty slots waiting for files",
  gfx: "avatars, banners, thumbnails, and experiments",
  osu: "maps, gameplay, tools, and falling rectangles",
  videos: "uploads and media-player-shaped placeholders",
  projects: "small tools and experiments that became real",
  links: "everywhere else this identity exists online",
  unknown: "optional files from somewhere less obvious",
} as const;

export default function HomePage() {
  const featuredArtwork = artwork.find((item) => item.id === profile.featuredArtworkId) ?? artwork[0];
  const sectionLinks = navigation.filter((item) => item.id !== "home");

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--quiet)]">
        <span>profile.boot / ready</span>
        <span className="flex items-center gap-2">
          <span className="status-light" aria-hidden="true" />
          manual status
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Window title="profile.card" eyebrow="home" className="xl:col-span-8">
          <div className="relative overflow-hidden p-5 sm:p-7 lg:p-9">
            <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/3 border-l border-[var(--line)] opacity-35 checkerboard sm:block" aria-hidden="true" />
            <div className="relative grid gap-6 sm:grid-cols-[9rem_1fr] sm:items-start">
              <div className="relative mx-auto w-full max-w-36 sm:mx-0">
                <div className="checkerboard relative aspect-square border border-[var(--line-bright)] p-2 shadow-[4px_4px_0_var(--shadow)]">
                  <Image
                    src={profile.avatar.src}
                    alt={profile.avatar.alt}
                    fill
                    priority
                    sizes="144px"
                    className="object-cover p-2"
                  />
                  <span className="absolute bottom-1 right-1 border border-[var(--signal-soft)] bg-[var(--panel)] px-1.5 py-1 font-mono text-[8px] uppercase text-[var(--signal)]">
                    placeholder
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 font-mono text-[9px] text-[var(--muted)]">
                  <span className="status-light" aria-hidden="true" />
                  {status.status}
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Tag tone="accent">personal archive</Tag>
                  <Tag tone="signal">{status.onlineState}</Tag>
                  <span className="font-mono text-[9px] text-[var(--quiet)]">rev.unscheduled</span>
                </div>
                <h1 className="text-balance text-4xl font-bold tracking-[-0.075em] text-[var(--ink)] sm:text-5xl">
                  SHEEPEX<span className="text-[var(--accent)]">_</span>
                </h1>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--signal)]">
                  {profile.tagline}
                </p>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
                  {profile.bio}
                </p>
                <p className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[var(--quiet)]">
                  <UserRound aria-hidden="true" className="size-3" />
                  alt: @{profile.alternativeUsernames.join(" / @")}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Tag key={interest}>{interest}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Window>

        <Window title="now.txt" eyebrow="manual" className="xl:col-span-4">
          <div className="divide-y divide-[var(--line)]">
            {[
              ["state", status.status],
              ["playing", status.currentlyPlaying],
              ["making", status.currentlyMaking],
              ["project", status.currentProject],
              ["updated", status.lastUpdated],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-3.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--quiet)]">{label}</span>
                <span className="text-xs leading-5 text-[var(--muted)]">{value ?? "not set"}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 font-mono text-[9px] leading-4 text-[var(--quiet)]">
            {status.note}
          </div>
        </Window>

        <Window title="featured-placeholder.img" eyebrow="preview" className="xl:col-span-7">
          <Link href="/art" className="group grid sm:grid-cols-[minmax(15rem,0.9fr)_1fr]">
            <div className="checkerboard relative min-h-72 overflow-hidden border-b border-[var(--line)] sm:border-b-0 sm:border-r">
              <Image
                src={featuredArtwork.image.src}
                alt={featuredArtwork.image.alt}
                fill
                sizes="(max-width: 640px) 100vw, 42vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none"
              />
            </div>
            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="mb-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[var(--quiet)]">
                  <FileImage aria-hidden="true" className="size-3.5 text-[var(--accent)]" />
                  selected file / {featuredArtwork.status}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">a slot for whatever shows up next.</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{featuredArtwork.description}</p>
              </div>
              <span className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                browse art folder
                <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Window>

        <Window title="about.md" eyebrow="short version" className="flex flex-col xl:col-span-5">
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 text-[var(--accent)]" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--line)]" />
              <Radio className="size-4" />
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">not a portfolio. more like a saved folder.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{profile.about}</p>
            <div className="mt-auto pt-6">
              <div className="dither-line mb-4" aria-hidden="true" />
              <div className="flex flex-wrap gap-2">
                {profile.quickLinkIds.map((id) => (
                  <ExternalAnchor key={id} href={links[id].url}>
                    {links[id].platform}
                  </ExternalAnchor>
                ))}
              </div>
            </div>
          </div>
        </Window>
      </div>

      <section className="mt-8" aria-labelledby="folder-title">
        <div className="mb-4 flex items-center gap-3">
          <Folder aria-hidden="true" className="size-4 text-[var(--accent)]" />
          <h2 id="folder-title" className="pixel-label text-[var(--ink)]">open folders</h2>
          <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
        </div>
        <div className="grid border-l border-t border-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          {sectionLinks.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className="group min-h-36 border-b border-r border-[var(--line)] bg-[var(--panel-soft)] p-4 transition-colors hover:bg-[var(--panel-raised)]"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[9px] text-[var(--quiet)]">{String(index + 1).padStart(2, "0")}/</span>
                <ArrowUpRight aria-hidden="true" className="size-3.5 text-[var(--quiet)] group-hover:text-[var(--accent)]" />
              </div>
              <h3 className="mt-5 font-mono text-sm font-semibold text-[var(--ink)]">{item.label}</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{sectionNotes[item.id as keyof typeof sectionNotes]}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 flex items-center gap-3 border border-dashed border-[var(--line-bright)] bg-[var(--panel-soft)] px-4 py-3 font-mono text-[9px] leading-4 text-[var(--quiet)]">
        <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
        this archive is intentionally manual. files, statuses, and links only change when their data files do.
      </div>
    </>
  );
}
