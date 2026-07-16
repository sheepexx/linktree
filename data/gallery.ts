import type { GalleryItem } from "../lib/content-types";

import { pixivArt } from "./pixiv-art";

export const galleryDescription =
  "selected art and graphics. more lives on pixiv and my hard drive.";

const gfxItems: readonly GalleryItem[] = [
  {
    id: "gfx-26699280",
    title: "sheepex_",
    category: "gfx",
    image: {
      src: "/gfx/26699280.png",
      alt: "osu! profile banner for sheepex_",
    },
    description: "osu! profile banner for sheepex_.",
    href: "https://osu.ppy.sh/u/26699280",
    aspect: "2000 / 500",
    wide: true,
  },
  {
    id: "gfx-23313260",
    title: "zeroxdd",
    category: "gfx",
    image: {
      src: "/gfx/23313260.png",
      alt: "osu! profile banner for zeroxdd",
    },
    description: "osu! profile banner for zeroxdd.",
    href: "https://osu.ppy.sh/u/23313260",
    aspect: "2000 / 500",
    wide: true,
  },
  {
    id: "gfx-28628229",
    title: "-Hatsune Miku-",
    category: "gfx",
    image: {
      src: "/gfx/28628229.png",
      alt: "osu! profile banner for -Hatsune Miku-",
    },
    description: "osu! profile banner for -Hatsune Miku-.",
    href: "https://osu.ppy.sh/u/28628229",
    aspect: "2000 / 500",
    wide: true,
  },
  {
    id: "gfx-37767001",
    title: "-Zell",
    category: "gfx",
    image: {
      src: "/gfx/37767001.png",
      alt: "osu! profile banner for -Zell",
    },
    description: "osu! profile banner for -Zell.",
    href: "https://osu.ppy.sh/u/37767001",
    aspect: "2000 / 500",
    wide: true,
  },
  {
    id: "gfx-38198321",
    title: "Twinx",
    category: "gfx",
    image: {
      src: "/gfx/38198321.png",
      alt: "osu! profile banner for Twinx",
    },
    description: "osu! profile banner for Twinx.",
    href: "https://osu.ppy.sh/u/38198321",
    aspect: "2000 / 500",
    wide: true,
  },
];

export const gallery: readonly GalleryItem[] = [...pixivArt, ...gfxItems];
