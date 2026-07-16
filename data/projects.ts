import type { Project } from "../lib/content-types";

export const projectsDescription =
  "small tools and websites that somehow became real.";

export const projects: readonly Project[] = [
  {
    id: "cascade",
    name: "Cascade",
    description: "a browser-based osu!mania editor and map viewer.",
    status: "online",
    liveUrl: "https://cascade.sheepex.net/",
  },
  {
    id: "osu-mutual-finder",
    name: "osu! Mutual Finder",
    description:
      "a browser extension for discovering likely mutual followers on osu!.",
    status: "online",
    liveUrl:
      "https://chromewebstore.google.com/detail/osu-mutual-finder/apgaopfjcbbhdphdlagbfhfighiboncg",
  },
  {
    id: "kps-bpm-tester",
    name: "KPS and BPM Tester",
    description: "a keyboard-speed and BPM testing tool for rhythm games.",
    status: "online",
    liveUrl: "https://sheepex.net/kps-tester/",
  },
];
