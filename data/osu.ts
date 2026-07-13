import type {
  OsuMapEntry,
  OsuProfileData,
} from "../lib/content-types";
import type { LinkId } from "./links";

export const osuProfile = {
  username: "sheepex_",
  alternativeUsername: "sheepexosu",
  profileLinkId: "osuProfile",
  mainMode: "osu!mania",
  interests: [
    "chordjack",
    "rhythm games",
    "gameplay",
    "beatmaps",
    "mapping",
    "tools",
    "community content",
  ],
  playstyleTags: ["chordjack", "osu!mania"],
  sectionDescription: "maps, gameplay, tools and too many falling rectangles.",
  currentSkin: null,
  keyboardSetup: null,
  currentGoal: null,
  statistics: null,
} as const satisfies OsuProfileData<LinkId>;

export const osuMaps = [
  {
    id: "lida-grustnyj-rap",
    displayTitle: "Lida — grustnyj rap",
    artist: "Lida",
    title: "grustnyj rap",
    versionLabel: null,
    relation: "publicly-associated title",
    linkId: null,
    note: "title supplied in the site brief; no statistics or achievements attached",
  },
  {
    id: "one-ok-rock-american-girls-juztan-remix",
    displayTitle: "ONE OK ROCK — American Girls, Juztan Remix",
    artist: "ONE OK ROCK",
    title: "American Girls, Juztan Remix",
    versionLabel: null,
    relation: "publicly-associated title",
    linkId: null,
    note: "title supplied in the site brief; no statistics or achievements attached",
  },
  {
    id: "nor-usagi-flap",
    displayTitle: "Nor — Usagi Flap",
    artist: "Nor",
    title: "Usagi Flap",
    versionLabel: null,
    relation: "publicly-associated title",
    linkId: null,
    note: "title supplied in the site brief; no statistics or achievements attached",
  },
  {
    id: "usao-quick-charge-sped-up-version",
    displayTitle: "USAO — Quick Charge, Sped Up Version",
    artist: "USAO",
    title: "Quick Charge, Sped Up Version",
    versionLabel: null,
    relation: "publicly-associated title",
    linkId: null,
    note: "title supplied in the site brief; no statistics or achievements attached",
  },
  {
    id: "mettekk-aura-codex",
    displayTitle: "Mettekk — Aura Codex",
    artist: "Mettekk",
    title: "Aura Codex",
    versionLabel: null,
    relation: "publicly-associated title",
    linkId: null,
    note: "title supplied in the site brief; no statistics or achievements attached",
  },
] as const satisfies readonly OsuMapEntry<LinkId>[];

export type OsuMapId = (typeof osuMaps)[number]["id"];
