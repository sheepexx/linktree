import type { SocialLink } from "../lib/content-types";

export const linksDescription = "everywhere else i exist on the internet.";

const socialLinkEntries = [
  {
    id: "osu",
    platform: "osu!",
    username: "sheepex_",
    url: "https://osu.ppy.sh/users/26699280",
  },
  {
    id: "youtube",
    platform: "YouTube",
    username: "@sheepexosu",
    url: "https://www.youtube.com/@sheepexosu",
  },
  {
    id: "x",
    platform: "X",
    username: "@sheepexosu",
    url: "https://x.com/sheepexosu",
  },
  {
    id: "pixiv",
    platform: "Pixiv",
    url: "https://www.pixiv.net/users/115687408",
  },
  {
    id: "github",
    platform: "GitHub",
    username: "@sheepexx",
    url: "https://github.com/sheepexx",
  },
  {
    id: "bilibili",
    platform: "Bilibili",
    url: "https://space.bilibili.com/3706994496112937/",
  },
] as const satisfies readonly SocialLink[];

export type SocialLinkId = (typeof socialLinkEntries)[number]["id"];

export const socialLinks: readonly SocialLink[] = socialLinkEntries;

export function getSocialLink(id: SocialLinkId): SocialLink {
  const link = socialLinks.find((entry) => entry.id === id);
  if (!link) throw new Error(`unknown social link: ${id}`);
  return link;
}
