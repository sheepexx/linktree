import type { MessageCatalog } from "../lib/content-types";

export const messages = {
  loading: [
    "loading sheepex_.exe",
    "opening profile...",
    "loading assets",
    "entering archive",
    "probably loading too many images",
  ],
  footer: [
    "thanks for visiting",
    "probably playing osu! right now",
    "made with too many tabs open",
    "still a work in progress",
    "updated whenever i remember",
    "no idea what to put here",
    "you found the bottom",
    "everything is probably unfinished",
    "refresh for another message",
  ],
  profile: [
    "online sometimes",
    "personal archive",
    "updated whenever i remember",
    "things i make when i feel like it",
  ],
  emptyGallery: [
    "nothing in this folder yet",
    "this slot is waiting for a real file",
    "check back after the hard drive has been searched",
  ],
  copied: ["copied", "link copied", "saved to clipboard"],
  secret: [
    "you probably weren't supposed to find this",
    "the folder was here the whole time",
    "nothing essential is hidden here",
  ],
} as const satisfies MessageCatalog;
