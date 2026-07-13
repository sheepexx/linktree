export type Nullable<T> = T | null;

export type SectionId =
  | "home"
  | "art"
  | "gfx"
  | "osu"
  | "videos"
  | "projects"
  | "links"
  | "unknown";

export interface LocalImageAsset {
  src: string;
  alt: string;
  placeholder: boolean;
  width?: number;
  height?: number;
}

export interface NavigationItem {
  id: SectionId;
  label: string;
  shortLabel: string;
  href: string;
  pathLabel: string;
  icon: string;
  shortcut: string | null;
  isSecret: boolean;
}

export interface SeoContent {
  title: string;
  description: string;
  socialPreview: LocalImageAsset;
}

export interface ProfileData<TLinkId extends string = string> {
  username: "sheepex_";
  displayName: "sheepex_";
  alternativeUsernames: readonly ["sheepexosu"];
  tagline: string;
  bio: string;
  about: string;
  interests: readonly string[];
  avatar: LocalImageAsset;
  featuredArtworkId: string | null;
  quickLinkIds: readonly TLinkId[];
  contactCopy: string;
  contactLinkIds: readonly TLinkId[];
  seo: SeoContent;
}

export type ArtworkCategory =
  | "Digital Art"
  | "Illustrations"
  | "Anime-inspired Art"
  | "Experiments"
  | "Sketches"
  | "Personal"
  | "Fan Art"
  | "Unfinished"
  | "Archive"
  | "Placeholder";

export type ArtworkStatus =
  | "finished"
  | "unfinished"
  | "archived"
  | "placeholder";

export interface ArtworkEntry<TLinkId extends string = string> {
  id: string;
  title: string;
  image: LocalImageAsset;
  fullResolutionImage: LocalImageAsset;
  category: ArtworkCategory;
  date: string | null;
  description: string;
  software: readonly string[];
  tags: readonly string[];
  externalLinkId: TLinkId | null;
  contentWarning: string | null;
  status: ArtworkStatus;
  unfinished: boolean;
  downloadEnabled: boolean;
  aspectRatio: `${number}/${number}`;
}

export type GfxType =
  | "Profile Picture"
  | "Avatar"
  | "Banner"
  | "Header"
  | "Thumbnail"
  | "osu! Graphic"
  | "Forum Graphic"
  | "Stream Graphic"
  | "Anime Edit"
  | "Typography Experiment"
  | "Colour Experiment"
  | "Personal Branding"
  | "Placeholder";

export type GfxStatus =
  | "finished"
  | "old"
  | "experiment"
  | "unused"
  | "archived"
  | "work in progress"
  | "personal"
  | "remake"
  | "placeholder";

export type GfxView = "thumbnail" | "list" | "file-browser";

export interface GfxEntry<TLinkId extends string = string> {
  id: string;
  fileName: string;
  title: string;
  previewImage: LocalImageAsset;
  fullImage: LocalImageAsset;
  type: GfxType;
  date: string | null;
  software: readonly string[];
  description: string;
  tags: readonly string[];
  externalLinkId: TLinkId | null;
  version: string | null;
  status: GfxStatus;
  downloadEnabled: boolean;
}

export interface OsuProfileData<TLinkId extends string = string> {
  username: "sheepex_";
  alternativeUsername: "sheepexosu";
  profileLinkId: TLinkId;
  mainMode: "osu!mania";
  interests: readonly string[];
  playstyleTags: readonly string[];
  sectionDescription: string;
  currentSkin: string | null;
  keyboardSetup: string | null;
  currentGoal: string | null;
  statistics: null;
}

export interface OsuMapEntry<TLinkId extends string = string> {
  id: string;
  displayTitle: string;
  artist: string;
  title: string;
  versionLabel: string | null;
  relation: "publicly-associated title";
  linkId: TLinkId | null;
  note: string;
}

export type VideoPlatform = "YouTube" | "Bilibili" | "X" | "Other";

export type VideoCategory =
  | "osu! gameplay"
  | "osu!mania"
  | "rhythm games"
  | "Geometry Dash"
  | "editing experiments"
  | "speed edits"
  | "graphic design process"
  | "personal uploads"
  | "archived videos"
  | "placeholder";

export interface VideoEntry<TLinkId extends string = string> {
  id: string;
  title: string;
  thumbnail: LocalImageAsset;
  platform: VideoPlatform;
  category: VideoCategory;
  uploadDate: string | null;
  description: string;
  externalLinkId: TLinkId | null;
  channelLinkId: TLinkId;
  duration: string | null;
  featured: boolean;
  status: "published" | "archived" | "placeholder";
}

export type ProjectStatus =
  | "online"
  | "work in progress"
  | "archived"
  | "experiment"
  | "abandoned"
  | "private"
  | "unfinished"
  | "status unknown";

export interface ProjectEntry<TLinkId extends string = string> {
  id: string;
  name: string;
  shortDescription: string;
  screenshot: LocalImageAsset;
  status: ProjectStatus;
  year: number | null;
  technologies: readonly string[];
  repositoryLinkId: TLinkId | null;
  liveLinkId: TLinkId | null;
  tags: readonly string[];
  openSource: boolean | null;
  developmentNote: string | null;
  features: readonly string[];
  featured: boolean;
}

export type LinkCategory =
  | "main"
  | "art"
  | "osu!"
  | "videos"
  | "development"
  | "social"
  | "archive"
  | "other";

export interface LinkEntry {
  platform: string;
  username: "sheepex_" | "sheepexosu" | null;
  url: string;
  category: LinkCategory;
  icon: string;
  description: string;
  status: "listed" | "archived" | "unavailable";
  accentColor: string;
  featured: boolean;
  external: true;
}

export interface StatusInfo {
  source: "manual";
  onlineState: "online" | "offline" | "away" | "sometimes";
  status: string;
  currentlyPlaying: string | null;
  currentlyMaking: string | null;
  currentSong: string | null;
  currentMap: string | null;
  currentProject: string | null;
  currentMood: string | null;
  lastUpdated: string;
  note: string;
}

export interface ThemeColors {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  border: string;
  positive: string;
  warning: string;
  danger: string;
  selection: string;
}

export interface ThemeOption {
  id: "default" | "night" | "pink" | "monochrome" | "archive";
  label: string;
  description: string;
  hidden: boolean;
  unlockHint: string | null;
  colors: ThemeColors;
}

export interface MessageCatalog {
  loading: readonly string[];
  footer: readonly string[];
  profile: readonly string[];
  emptyGallery: readonly string[];
  copied: readonly string[];
  secret: readonly string[];
}

export type EasterEggTrigger =
  | {
      type: "typed-sequence";
      sequence: string;
      timeoutMs: number;
    }
  | {
      type: "key-sequence";
      keys: readonly string[];
      timeoutMs: number;
    }
  | {
      type: "logo-clicks";
      count: number;
      timeoutMs: number;
    };

export type EasterEggEffect =
  | { type: "open-section"; sectionId: SectionId }
  | { type: "unlock-theme"; themeId: ThemeOption["id"] }
  | { type: "show-message"; message: string };

export interface EasterEgg {
  id: string;
  label: string;
  description: string;
  trigger: EasterEggTrigger;
  effect: EasterEggEffect;
  accessibilityAlternative: string;
  enabled: boolean;
}

export interface SecretFolderFile {
  id: string;
  fileName: string;
  kind: "text" | "image-placeholder" | "folder-placeholder";
  label: string;
  content: string;
  localAssetPath: string | null;
  placeholder: boolean;
}

export interface SecretFolderData {
  title: "???";
  description: string;
  accessibilityNote: string;
  files: readonly SecretFolderFile[];
}
