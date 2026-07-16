import type { OsuData } from "../lib/content-types";

export const osu = {
  username: "sheepex_",
  mainMode: "osu!mania",
  description:
    "mostly osu!mania: playing, mapping and building small tools around the game.",
} as const satisfies OsuData;
