import type { ProjectEntry } from "../lib/content-types";
import type { LinkId } from "./links";

export const projectsSectionDescription =
  "small tools, websites and experiments that somehow became real.";

export const projects = [
  {
    id: "cascade",
    name: "Cascade",
    shortDescription: "a browser-based osu!mania editor and map viewer.",
    screenshot: {
      src: "/projects/project-screenshot-placeholder-01.svg",
      alt: "clearly labelled screenshot placeholder for Cascade",
      placeholder: true,
    },
    status: "online",
    year: null,
    technologies: [],
    repositoryLinkId: null,
    liveLinkId: "cascade",
    tags: ["osu!mania", "mapping", "editor", "map viewer"],
    openSource: null,
    developmentNote: "year, technology and repository details have not been provided.",
    features: [
      "import and export osu! files",
      "timing and hit-object editing",
      "multiple key modes",
      "map conversion",
    ],
    featured: true,
  },
  {
    id: "osu-mutual-finder",
    name: "osu! Mutual Finder",
    shortDescription:
      "a browser extension for discovering likely mutual followers on osu!.",
    screenshot: {
      src: "/projects/project-screenshot-placeholder-02.svg",
      alt: "clearly labelled screenshot placeholder for osu! Mutual Finder",
      placeholder: true,
    },
    status: "status unknown",
    year: null,
    technologies: [],
    repositoryLinkId: null,
    liveLinkId: null,
    tags: ["osu!", "browser extension", "social tools"],
    openSource: null,
    developmentNote:
      "a public project link, year, technology and current status have not been provided.",
    features: [
      "mutual-follow analysis",
      "filters",
      "duplicate detection",
      "result export",
    ],
    featured: false,
  },
  {
    id: "kps-bpm-tester",
    name: "KPS and BPM Tester",
    shortDescription:
      "a keyboard-speed and BPM testing tool for rhythm games.",
    screenshot: {
      src: "/projects/project-screenshot-placeholder-03.svg",
      alt: "clearly labelled screenshot placeholder for KPS and BPM Tester",
      placeholder: true,
    },
    status: "online",
    year: null,
    technologies: [],
    repositoryLinkId: null,
    liveLinkId: "kpsTester",
    tags: ["rhythm games", "KPS", "BPM", "keyboard"],
    openSource: null,
    developmentNote: "year, technology and repository details have not been provided.",
    features: ["keyboard-speed testing", "BPM testing"],
    featured: true,
  },
  {
    id: "osu-background-mp3-extractor",
    name: "osu! Background and MP3 Extractor",
    shortDescription:
      "a browser-based tool for extracting backgrounds and audio from osu! beatmap files.",
    screenshot: {
      src: "/projects/project-screenshot-placeholder-04.svg",
      alt: "clearly labelled screenshot placeholder for osu! Background and MP3 Extractor",
      placeholder: true,
    },
    status: "online",
    year: null,
    technologies: [],
    repositoryLinkId: null,
    liveLinkId: "osuBackgroundExtractor",
    tags: ["osu!", "beatmaps", "browser tool", "file extraction"],
    openSource: null,
    developmentNote: "year, technology and repository details have not been provided.",
    features: ["background extraction", "audio extraction"],
    featured: true,
  },
] as const satisfies readonly ProjectEntry<LinkId>[];

export type ProjectId = (typeof projects)[number]["id"];
