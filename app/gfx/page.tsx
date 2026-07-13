import type { Metadata } from "next";

import { GfxBrowser } from "@/components/gallery/GfxBrowser";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Tag } from "@/components/ui/Tag";
import { gfxEntries, gfxSectionDescription } from "@/data/gfx";

export const metadata: Metadata = {
  title: "GFX folder",
  description: "The sheepex_ GFX folder for avatars, banners, thumbnails, experiments, and manually supplied graphics.",
  alternates: { canonical: "/gfx" },
};

export default function GfxPage() {
  return (
    <>
      <SectionIntro
        index="03"
        title={gfxSectionDescription}
        description="switch between contact sheet, list, and file-browser views. every current image is an explicit empty slot, not claimed work."
        aside={<Tag tone="warning">{gfxEntries.length} replaceable files</Tag>}
      />
      <GfxBrowser />
    </>
  );
}
