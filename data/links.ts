import type { LinkEntry } from "../lib/content-types";

export const links = {
  mainWebsite: {
    platform: "main website",
    username: "sheepex_",
    url: "https://sheepex.net/",
    category: "main",
    icon: "globe",
    description: "the main corner of the internet",
    status: "listed",
    accentColor: "#b9a4c9",
    featured: true,
    external: true,
  },
  osuProfile: {
    platform: "osu!",
    username: "sheepex_",
    url: "https://osu.ppy.sh/users/26699280",
    category: "osu!",
    icon: "circle-dot",
    description: "osu!mania profile",
    status: "listed",
    accentColor: "#c99bab",
    featured: true,
    external: true,
  },
  youtube: {
    platform: "YouTube",
    username: "sheepexosu",
    url: "https://www.youtube.com/@sheepexosu",
    category: "videos",
    icon: "play",
    description: "gameplay, edits and other uploads",
    status: "listed",
    accentColor: "#c98383",
    featured: true,
    external: true,
  },
  x: {
    platform: "X / Twitter",
    username: "sheepexosu",
    url: "https://x.com/sheepexosu",
    category: "social",
    icon: "at-sign",
    description: "art, rhythm games and personal online activity",
    status: "listed",
    accentColor: "#aeb8c2",
    featured: false,
    external: true,
  },
  pixiv: {
    platform: "Pixiv",
    username: "sheepex_",
    url: "https://www.pixiv.net/users/115687408",
    category: "art",
    icon: "image",
    description: "external art profile",
    status: "listed",
    accentColor: "#7ca6c7",
    featured: true,
    external: true,
  },
  github: {
    platform: "GitHub",
    username: null,
    url: "https://github.com/sheepexx",
    category: "development",
    icon: "code-2",
    description: "code, tools and experiments",
    status: "listed",
    accentColor: "#aeb5ad",
    featured: true,
    external: true,
  },
  bilibili: {
    platform: "Bilibili",
    username: "sheepexosu",
    url: "https://space.bilibili.com/3706994496112937/",
    category: "videos",
    icon: "tv",
    description: "another home for video uploads",
    status: "listed",
    accentColor: "#83b7c3",
    featured: false,
    external: true,
  },
  cascade: {
    platform: "Cascade",
    username: null,
    url: "https://cascade.sheepex.net/",
    category: "development",
    icon: "layers-3",
    description: "browser-based osu!mania editor and map viewer",
    status: "listed",
    accentColor: "#9da8c9",
    featured: true,
    external: true,
  },
  kpsTester: {
    platform: "KPS and BPM Tester",
    username: null,
    url: "https://sheepex.net/kps-tester/",
    category: "development",
    icon: "keyboard",
    description: "keyboard speed and BPM testing for rhythm games",
    status: "listed",
    accentColor: "#98b6a0",
    featured: true,
    external: true,
  },
  osuBackgroundExtractor: {
    platform: "osu! Background and MP3 Extractor",
    username: null,
    url: "https://sheepex.net/osu-bg-extractor/",
    category: "development",
    icon: "archive-restore",
    description: "extract backgrounds and audio from osu! beatmap files",
    status: "listed",
    accentColor: "#b8a27e",
    featured: true,
    external: true,
  },
} as const satisfies Record<string, LinkEntry>;

export type LinkId = keyof typeof links;

export const linkDirectoryOrder = [
  "mainWebsite",
  "osuProfile",
  "pixiv",
  "youtube",
  "bilibili",
  "x",
  "github",
  "cascade",
  "kpsTester",
  "osuBackgroundExtractor",
] as const satisfies readonly LinkId[];

export const featuredLinkIds = linkDirectoryOrder.filter(
  (linkId) => links[linkId].featured,
);

export const contactLinkIds = [
  "x",
  "osuProfile",
  "youtube",
] as const satisfies readonly LinkId[];

export const mediaEmbedOrigins = {
  youtubePrivacy: "https://www.youtube-nocookie.com/embed/",
  bilibiliPlayer: "https://player.bilibili.com/player.html",
} as const;

export function getLink(linkId: LinkId) {
  return links[linkId];
}
