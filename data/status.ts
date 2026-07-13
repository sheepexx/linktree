import type { StatusInfo } from "../lib/content-types";

export const status = {
  source: "manual",
  onlineState: "sometimes",
  status: "online sometimes",
  currentlyPlaying: "osu!mania",
  currentlyMaking: "probably another unfinished graphic",
  currentSong: null,
  currentMap: null,
  currentProject: "editing random things",
  currentMood: null,
  lastUpdated: "whenever i remembered",
  note: "manual status — edit data/status.ts when something changes",
} as const satisfies StatusInfo;
