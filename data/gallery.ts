import type { GalleryItem } from "../lib/content-types";

export const galleryDescription =
  "selected art and graphics. more lives on pixiv and my hard drive.";

export const gallery = [
  {
    id: "artwork-placeholder-01",
    title: "artwork placeholder 01",
    category: "art",
    image: {
      src: "/art/artwork-placeholder-01.svg",
      alt: "clearly labelled empty artwork slot 01",
    },
    description:
      "labelled placeholder — replace this record and file only when real artwork is provided.",
  },
  {
    id: "artwork-placeholder-02",
    title: "artwork placeholder 02",
    category: "art",
    image: {
      src: "/art/artwork-placeholder-02.svg",
      alt: "clearly labelled empty landscape artwork slot 02",
    },
    description:
      "labelled placeholder — no artwork or authorship is claimed here.",
  },
  {
    id: "artwork-placeholder-03",
    title: "artwork placeholder 03",
    category: "art",
    image: {
      src: "/art/artwork-placeholder-03.svg",
      alt: "clearly labelled empty square artwork slot 03",
    },
    description:
      "labelled placeholder — add a manually supplied image, title and details later.",
  },
  {
    id: "gfx-placeholder-01",
    title: "gfx placeholder 01",
    category: "gfx",
    image: {
      src: "/gfx/gfx-placeholder-01.svg",
      alt: "clearly labelled empty GFX slot 01",
    },
    description:
      "labelled placeholder — replace with a manually supplied graphic and verified details.",
  },
  {
    id: "gfx-placeholder-02",
    title: "gfx placeholder 02",
    category: "gfx",
    image: {
      src: "/gfx/gfx-placeholder-02.svg",
      alt: "clearly labelled empty wide GFX slot 02",
    },
    description:
      "labelled placeholder sized for a future banner, header or thumbnail.",
  },
  {
    id: "gfx-placeholder-03",
    title: "gfx placeholder 03",
    category: "gfx",
    image: {
      src: "/gfx/gfx-placeholder-03.svg",
      alt: "clearly labelled empty square GFX slot 03",
    },
    description:
      "labelled placeholder sized for a future avatar or profile picture.",
  },
] as const satisfies readonly GalleryItem[];
