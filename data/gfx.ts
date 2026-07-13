import type { GfxEntry, GfxView } from "../lib/content-types";
import type { LinkId } from "./links";

export const gfxSectionDescription =
  "avatars, banners, thumbnails and other files hiding on my hard drive.";

export const gfxEntries = [
  {
    id: "gfx-placeholder-01",
    fileName: "gfx-placeholder-01.svg",
    title: "gfx placeholder 01",
    previewImage: {
      src: "/gfx/gfx-placeholder-01.svg",
      alt: "clearly labelled empty GFX slot 01",
      placeholder: true,
    },
    fullImage: {
      src: "/gfx/gfx-placeholder-01.svg",
      alt: "full-size clearly labelled empty GFX slot 01",
      placeholder: true,
    },
    type: "Placeholder",
    date: null,
    software: [],
    description:
      "labelled placeholder — replace with a manually supplied graphic and verified details.",
    tags: ["placeholder", "replace me"],
    externalLinkId: null,
    version: null,
    status: "placeholder",
    downloadEnabled: false,
  },
  {
    id: "gfx-placeholder-02",
    fileName: "gfx-placeholder-02.svg",
    title: "gfx placeholder 02",
    previewImage: {
      src: "/gfx/gfx-placeholder-02.svg",
      alt: "clearly labelled empty wide GFX slot 02",
      placeholder: true,
    },
    fullImage: {
      src: "/gfx/gfx-placeholder-02.svg",
      alt: "full-size clearly labelled empty wide GFX slot 02",
      placeholder: true,
    },
    type: "Placeholder",
    date: null,
    software: [],
    description:
      "labelled placeholder sized for a future banner, header or thumbnail.",
    tags: ["placeholder", "wide slot"],
    externalLinkId: null,
    version: null,
    status: "placeholder",
    downloadEnabled: false,
  },
  {
    id: "gfx-placeholder-03",
    fileName: "gfx-placeholder-03.svg",
    title: "gfx placeholder 03",
    previewImage: {
      src: "/gfx/gfx-placeholder-03.svg",
      alt: "clearly labelled empty square GFX slot 03",
      placeholder: true,
    },
    fullImage: {
      src: "/gfx/gfx-placeholder-03.svg",
      alt: "full-size clearly labelled empty square GFX slot 03",
      placeholder: true,
    },
    type: "Placeholder",
    date: null,
    software: [],
    description:
      "labelled placeholder sized for a future avatar or profile picture.",
    tags: ["placeholder", "square slot"],
    externalLinkId: null,
    version: null,
    status: "placeholder",
    downloadEnabled: false,
  },
] as const satisfies readonly GfxEntry<LinkId>[];

export type GfxId = (typeof gfxEntries)[number]["id"];

export const gfxViews = [
  "thumbnail",
  "list",
  "file-browser",
] as const satisfies readonly GfxView[];
