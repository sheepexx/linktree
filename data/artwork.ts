import type { ArtworkEntry } from "../lib/content-types";
import type { LinkId } from "./links";

export const artworkSectionDescription =
  "finished art, unfinished art and things that probably belong somewhere in between.";

export const artwork = [
  {
    id: "artwork-placeholder-01",
    title: "artwork placeholder 01",
    image: {
      src: "/art/artwork-placeholder-01.svg",
      alt: "clearly labelled empty artwork slot 01",
      placeholder: true,
    },
    fullResolutionImage: {
      src: "/art/artwork-placeholder-01.svg",
      alt: "full-size clearly labelled empty artwork slot 01",
      placeholder: true,
    },
    category: "Placeholder",
    date: null,
    description:
      "labelled placeholder — replace this record and file only when real artwork is provided.",
    software: [],
    tags: ["placeholder", "replace me"],
    externalLinkId: null,
    contentWarning: null,
    status: "placeholder",
    unfinished: false,
    downloadEnabled: false,
    aspectRatio: "4/5",
  },
  {
    id: "artwork-placeholder-02",
    title: "artwork placeholder 02",
    image: {
      src: "/art/artwork-placeholder-02.svg",
      alt: "clearly labelled empty landscape artwork slot 02",
      placeholder: true,
    },
    fullResolutionImage: {
      src: "/art/artwork-placeholder-02.svg",
      alt: "full-size clearly labelled empty landscape artwork slot 02",
      placeholder: true,
    },
    category: "Placeholder",
    date: null,
    description:
      "labelled placeholder — no artwork or authorship is claimed here.",
    software: [],
    tags: ["placeholder", "landscape slot"],
    externalLinkId: null,
    contentWarning: null,
    status: "placeholder",
    unfinished: false,
    downloadEnabled: false,
    aspectRatio: "16/10",
  },
  {
    id: "artwork-placeholder-03",
    title: "artwork placeholder 03",
    image: {
      src: "/art/artwork-placeholder-03.svg",
      alt: "clearly labelled empty square artwork slot 03",
      placeholder: true,
    },
    fullResolutionImage: {
      src: "/art/artwork-placeholder-03.svg",
      alt: "full-size clearly labelled empty square artwork slot 03",
      placeholder: true,
    },
    category: "Placeholder",
    date: null,
    description:
      "labelled placeholder — add a manually supplied image, title and details later.",
    software: [],
    tags: ["placeholder", "square slot"],
    externalLinkId: null,
    contentWarning: null,
    status: "placeholder",
    unfinished: false,
    downloadEnabled: false,
    aspectRatio: "1/1",
  },
] as const satisfies readonly ArtworkEntry<LinkId>[];

export type ArtworkId = (typeof artwork)[number]["id"];

export const artworkCategories = [
  "All",
  "Digital Art",
  "Illustrations",
  "Anime-inspired Art",
  "Experiments",
  "Sketches",
  "Personal",
  "Fan Art",
  "Unfinished",
  "Archive",
  "Placeholder",
] as const;

export const artworkViews = ["grid", "scrapbook"] as const;
