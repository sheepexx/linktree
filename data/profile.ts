import type { ProfileData } from "../lib/content-types";
import type { LinkId } from "./links";

export const profile = {
  username: "sheepex_",
  displayName: "sheepex_",
  alternativeUsernames: ["sheepexosu"],
  tagline: "art, gfx, osu! and other internet things",
  bio: "hey, this is sheepex_. i make graphics, play rhythm games, build small tools and upload whatever i feel like.",
  about:
    "i make graphics, play rhythm games, build small tools, edit videos and start more projects than i finish. this site is where all of that ends up.",
  interests: [
    "art",
    "gfx",
    "osu!mania",
    "rhythm games",
    "anime",
    "video editing",
    "web experiments",
    "gaming",
  ],
  avatar: {
    src: "/avatar-placeholder.svg",
    alt: "avatar placeholder for sheepex_",
    placeholder: true,
  },
  featuredArtworkId: "artwork-placeholder-01",
  quickLinkIds: ["pixiv", "osuProfile", "youtube", "github"],
  contactCopy:
    "want to talk about art, osu!, graphics, projects or something random? use one of these.",
  contactLinkIds: ["x", "osuProfile", "youtube"],
  seo: {
    title: "sheepex_ — art, GFX, osu! and internet projects",
    description:
      "A personal archive for art, GFX, osu!, rhythm games, videos, tools and other internet projects.",
    socialPreview: {
      src: "/social-preview-placeholder.png",
      alt: "placeholder social preview for sheepex_",
      placeholder: true,
    },
  },
} as const satisfies ProfileData<LinkId>;
