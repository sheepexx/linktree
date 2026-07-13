import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";

import { ArtGallery } from "@/components/gallery/ArtGallery";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Tag } from "@/components/ui/Tag";
import { artwork, artworkSectionDescription } from "@/data/artwork";

export const metadata: Metadata = {
  title: "art archive",
  description: "A manually maintained art archive for sheepex_ with filters, an accessible lightbox, and honest placeholder slots.",
  alternates: { canonical: "/art" },
};

export default function ArtPage() {
  return (
    <>
      <SectionIntro
        index="02"
        title={artworkSectionDescription}
        description="the gallery machinery is ready. the current files are clearly labelled empty slots until manually supplied artwork is added."
        aside={
          <div className="flex items-center gap-2">
            <Tag tone="warning">placeholder archive</Tag>
            <span className="flex items-center gap-2 font-mono text-[9px] text-[var(--quiet)]">
              <ImageIcon aria-hidden="true" className="size-3.5" /> {artwork.length} slots
            </span>
          </div>
        }
      />
      <ArtGallery />
    </>
  );
}
