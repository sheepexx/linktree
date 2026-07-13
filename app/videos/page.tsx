import type { Metadata } from "next";
import { ExternalLink, PlaySquare } from "lucide-react";

import { VideoDeck } from "@/components/videos/VideoDeck";
import { ExternalAnchor } from "@/components/ui/ExternalAnchor";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { links } from "@/data/links";
import { videos, videosSectionDescription } from "@/data/videos";

export const metadata: Metadata = {
  title: "videos",
  description: "A privacy-conscious manual video playlist for sheepex_ uploads, gameplay, edits, and rhythm-game clips.",
  alternates: { canonical: "/videos" },
};

export default function VideosPage() {
  return (
    <>
      <SectionIntro
        index="05"
        title={videosSectionDescription}
        description="the player stays empty until a manually selected real upload is attached and a visitor chooses to load it. no autoplay, views, or subscriber counts."
        aside={
          <div className="flex flex-wrap gap-2">
            <ExternalAnchor href={links.youtube.url}>
              <PlaySquare aria-hidden="true" className="size-3.5" /> YouTube
            </ExternalAnchor>
            <ExternalAnchor href={links.bilibili.url}>
              <ExternalLink aria-hidden="true" className="size-3.5" /> Bilibili
            </ExternalAnchor>
          </div>
        }
      />
      <VideoDeck />
      <p className="mt-5 border border-dashed border-[var(--line-bright)] bg-[var(--panel-soft)] p-4 font-mono text-[9px] leading-4 text-[var(--quiet)]">
        {videos.length} playlist slots are configured. current entries are labelled placeholders and do not represent uploads.
      </p>
    </>
  );
}
