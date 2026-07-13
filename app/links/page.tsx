import type { Metadata } from "next";

import { LinkDirectory } from "@/components/links/LinkDirectory";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { ExternalAnchor } from "@/components/ui/ExternalAnchor";
import { Window } from "@/components/ui/Window";
import { links, contactLinkIds } from "@/data/links";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: "links",
  description: "Everywhere else sheepex_ exists online, collected in one manually maintained directory.",
  alternates: { canonical: "/links" },
};

export default function LinksPage() {
  return (
    <>
      <SectionIntro
        index="07"
        title="everywhere else i exist online."
        description="one bookmark folder for art, rhythm games, uploads, code, and whatever comes next."
      />

      <LinkDirectory />

      <Window title="contact.txt" eyebrow="informal" className="mt-7">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">messages, maps, random projects—use one of these.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{profile.contactCopy}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {contactLinkIds.map((id) => (
              <ExternalAnchor key={id} href={links[id].url}>
                {links[id].platform}
              </ExternalAnchor>
            ))}
          </div>
        </div>
      </Window>
    </>
  );
}
