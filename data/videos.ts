import type { VideoEntry } from "../lib/content-types";
import type { LinkId } from "./links";

export const videosSectionDescription =
  "gameplay, edits and uploads, loaded only when you ask for them.";

export const videos = [
  {
    id: "video-placeholder-01",
    title: "video placeholder 01",
    thumbnail: {
      src: "/videos/video-thumbnail-placeholder-01.svg",
      alt: "clearly labelled empty video thumbnail slot 01",
      placeholder: true,
    },
    platform: "YouTube",
    category: "placeholder",
    uploadDate: null,
    description:
      "labelled placeholder — add a real upload title, thumbnail and video link later.",
    externalLinkId: null,
    channelLinkId: "youtube",
    duration: null,
    featured: false,
    status: "placeholder",
  },
  {
    id: "video-placeholder-02",
    title: "video placeholder 02",
    thumbnail: {
      src: "/videos/video-thumbnail-placeholder-02.svg",
      alt: "clearly labelled empty video thumbnail slot 02",
      placeholder: true,
    },
    platform: "Bilibili",
    category: "placeholder",
    uploadDate: null,
    description:
      "labelled placeholder — no upload, date, duration or view count is claimed.",
    externalLinkId: null,
    channelLinkId: "bilibili",
    duration: null,
    featured: false,
    status: "placeholder",
  },
] as const satisfies readonly VideoEntry<LinkId>[];

export type VideoId = (typeof videos)[number]["id"];
