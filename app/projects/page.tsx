import type { Metadata } from "next";
import { Code2 } from "lucide-react";

import { ProjectArchive } from "@/components/projects/ProjectArchive";
import { ExternalAnchor } from "@/components/ui/ExternalAnchor";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { links } from "@/data/links";
import { projectsSectionDescription } from "@/data/projects";

export const metadata: Metadata = {
  title: "projects",
  description: "Small tools, rhythm-game utilities, websites, and experiments collected by sheepex_.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <SectionIntro
        index="06"
        title={projectsSectionDescription}
        description="a project folder, not a résumé. only supplied features and links are listed; missing details stay missing."
        aside={
          <ExternalAnchor href={links.github.url}>
            <Code2 aria-hidden="true" className="size-3.5" /> github profile
          </ExternalAnchor>
        }
      />
      <ProjectArchive />
    </>
  );
}
