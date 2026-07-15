import type { OsuData } from "../lib/content-types";

export const osu = {
  username: "sheepex_",
  mainMode: "osu!mania",
  description:
    "mostly osu!mania — playing, mapping and building small tools around the game.",
  highlights: [
    {
      id: "lida-grustnyj-rap",
      title: "Lida — grustnyj rap",
    },
    {
      id: "one-ok-rock-american-girls-juztan-remix",
      title: "ONE OK ROCK — American Girls (Juztan Remix)",
    },
    {
      id: "nor-usagi-flap",
      title: "Nor — Usagi Flap",
    },
  ],
} as const satisfies OsuData;
