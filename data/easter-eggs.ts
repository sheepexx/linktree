import type {
  EasterEgg,
  SecretFolderData,
} from "../lib/content-types";

export const easterEggs = [
  {
    id: "typed-osu",
    label: "open the strange folder",
    description: "typing a familiar three-letter sequence opens the ??? section",
    trigger: {
      type: "typed-sequence",
      sequence: "osu",
      timeoutMs: 1600,
    },
    effect: {
      type: "open-section",
      sectionId: "unknown",
    },
    accessibilityAlternative:
      "Use the always-available ??? navigation item or the open secret command.",
    enabled: true,
  },
  {
    id: "archive-theme",
    label: "archive signal",
    description: "the old directional key sequence unlocks a hidden theme",
    trigger: {
      type: "key-sequence",
      keys: [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
      ],
      timeoutMs: 5000,
    },
    effect: {
      type: "unlock-theme",
      themeId: "archive",
    },
    accessibilityAlternative:
      "Open ??? and use the labelled unlock archive theme control.",
    enabled: true,
  },
  {
    id: "logo-static",
    label: "logo cache",
    description: "repeatedly selecting the logo reveals a small message",
    trigger: {
      type: "logo-clicks",
      count: 5,
      timeoutMs: 3000,
    },
    effect: {
      type: "show-message",
      message: "still clicking? the cache is empty.",
    },
    accessibilityAlternative:
      "Open ??? and use the labelled show hidden message action.",
    enabled: true,
  },
] as const satisfies readonly EasterEgg[];

export const secretFolder = {
  title: "???",
  description: "you probably weren't supposed to find this.",
  accessibilityNote:
    "This folder is optional. Every essential section remains available in the main navigation.",
  files: [
    {
      id: "read-me-again",
      fileName: "read_me_again.txt",
      kind: "text",
      label: "read me again",
      content: "nothing essential is hidden here. probably.",
      localAssetPath: null,
      placeholder: false,
    },
    {
      id: "old-gfx-slot",
      fileName: "old_gfx_placeholder.folder",
      kind: "folder-placeholder",
      label: "old gfx placeholder",
      content: "replace this folder entry when a real archived file is added.",
      localAssetPath: null,
      placeholder: true,
    },
    {
      id: "unfinished-art-slot",
      fileName: "unfinished_art_placeholder.img",
      kind: "image-placeholder",
      label: "unfinished artwork placeholder",
      content: "this is a labelled empty slot, not an artwork.",
      localAssetPath: null,
      placeholder: true,
    },
  ],
} as const satisfies SecretFolderData;
