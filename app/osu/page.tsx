import type { Metadata } from "next";
import { ArrowUpRight, CircleDot, FileMusic, Keyboard, RadioTower } from "lucide-react";

import { RhythmLab } from "@/components/osu/RhythmLab";
import { ExternalAnchor } from "@/components/ui/ExternalAnchor";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Tag } from "@/components/ui/Tag";
import { Window } from "@/components/ui/Window";
import { links } from "@/data/links";
import { osuMaps, osuProfile } from "@/data/osu";

export const metadata: Metadata = {
  title: "osu!mania",
  description: "The sheepex_ osu!mania folder: publicly associated map titles, rhythm-game interests, and tools.",
  alternates: { canonical: "/osu" },
};

export default function OsuPage() {
  const profileLink = links[osuProfile.profileLinkId];

  return (
    <>
      <SectionIntro
        index="04"
        title={osuProfile.sectionDescription}
        description="the osu!mania side of the archive—kept manual, lightweight, and deliberately free of rank snapshots."
        aside={<ExternalAnchor href={profileLink.url}>open osu! profile</ExternalAnchor>}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
        <Window title="player.ini" eyebrow="identity">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="grid size-14 place-items-center border border-[var(--accent-soft)] bg-[var(--panel-soft)] shadow-[3px_3px_0_var(--shadow)]">
                  <CircleDot aria-hidden="true" className="size-6 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--quiet)]">online identity</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{osuProfile.username}</h2>
                  <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">alt / {osuProfile.alternativeUsername}</p>
                </div>
              </div>
              <Tag tone="accent">main mode: {osuProfile.mainMode}</Tag>
            </div>

            <div className="mt-6 dither-line" aria-hidden="true" />
            <div className="mt-5 flex flex-wrap gap-2">
              {osuProfile.interests.map((interest) => (
                <Tag key={interest}>{interest}</Tag>
              ))}
            </div>

            <dl className="mt-6 grid border-l border-t border-[var(--line)] font-mono text-[10px] sm:grid-cols-2">
              {[
                ["playstyle", osuProfile.playstyleTags.join(" / ")],
                ["skin", osuProfile.currentSkin ?? "not listed"],
                ["keyboard", osuProfile.keyboardSetup ?? "not listed"],
                ["current goal", osuProfile.currentGoal ?? "not listed"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-r border-[var(--line)] p-3">
                  <dt className="text-[var(--quiet)]">{label}</dt>
                  <dd className="mt-1 text-[var(--muted)]">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 border-l-2 border-[var(--signal)] bg-[color-mix(in_srgb,var(--signal)_6%,transparent)] p-3 font-mono text-[9px] leading-4 text-[var(--quiet)]">
              changing profile statistics are intentionally omitted. this page works without an API.
            </p>
          </div>
        </Window>

        <Window title="rhythm_tools.links" eyebrow="shortcuts">
          <div className="divide-y divide-[var(--line)]">
            {["cascade", "kpsTester", "osuBackgroundExtractor"].map((id) => {
              const entry = links[id as "cascade" | "kpsTester" | "osuBackgroundExtractor"];
              return (
                <a
                  key={id}
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex min-h-20 items-center gap-4 px-4 py-3 hover:bg-[var(--panel-raised)]"
                >
                  <span className="grid size-10 place-items-center border border-[var(--line)] bg-[var(--canvas-deep)]">
                    <Keyboard aria-hidden="true" className="size-4 text-[var(--signal)]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-xs text-[var(--ink)]">{entry.platform}</strong>
                    <span className="mt-1 block text-[11px] leading-4 text-[var(--muted)]">{entry.description}</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="size-3.5 text-[var(--quiet)] group-hover:text-[var(--accent)]" />
                </a>
              );
            })}
          </div>
        </Window>
      </div>

      <Window title="publicly_associated_titles.list" eyebrow="map folder" className="mt-5">
        <div className="grid border-l border-t border-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
          {osuMaps.map((map, index) => (
            <article key={map.id} className="group min-h-52 border-b border-r border-[var(--line)] bg-[var(--panel-soft)] p-4 hover:bg-[var(--panel-raised)]">
              <div className="flex items-start justify-between">
                <FileMusic aria-hidden="true" className="size-4 text-[var(--accent)]" />
                <span className="font-mono text-[9px] text-[var(--quiet)]">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <p className="mt-5 font-mono text-[9px] uppercase tracking-wider text-[var(--signal)]">{map.artist}</p>
              <h3 className="mt-2 text-sm font-semibold leading-5 text-[var(--ink)]">{map.title}</h3>
              <p className="mt-4 font-mono text-[8px] uppercase leading-4 text-[var(--quiet)]">{map.relation}</p>
            </article>
          ))}
        </div>
        <div className="flex items-start gap-3 border-t border-[var(--line)] p-4 text-xs leading-5 text-[var(--muted)]">
          <RadioTower aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--signal)]" />
          Titles are listed from the supplied public association only. No rankings, awards, counts, or mapping achievements are implied.
        </div>
      </Window>

      <div className="mt-5">
        <RhythmLab />
      </div>
    </>
  );
}
