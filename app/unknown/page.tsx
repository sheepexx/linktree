import type { Metadata } from "next";

import { SecretFolderExplorer } from "@/components/unknown/SecretFolderExplorer";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Tag } from "@/components/ui/Tag";
import { secretFolder } from "@/data/easter-eggs";

export const metadata: Metadata = {
  title: "???",
  description: "An optional secret folder in the SHEEPEX archive. Nothing essential is hidden here.",
  alternates: { canonical: "/unknown" },
  robots: { index: false, follow: true },
};

export default function UnknownPage() {
  return (
    <>
      <SectionIntro
        index="??"
        title={secretFolder.description}
        description={secretFolder.accessibilityNote}
        aside={<Tag tone="warning">corrupted / readable</Tag>}
      />
      <SecretFolderExplorer />
      <p className="mt-5 border border-dashed border-[var(--line-bright)] bg-[var(--panel-soft)] p-4 font-mono text-[9px] leading-4 text-[var(--quiet)]">
        accessibility route: this page is always available through the labelled ??? navigation item and command palette. no timing or secret input is required.
      </p>
    </>
  );
}
