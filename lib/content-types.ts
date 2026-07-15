export type GalleryCategory = "art" | "gfx";

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  image: {
    src: string;
    alt: string;
  };
  /** Optional short text shown in the lightbox only. */
  description?: string;
}

export interface OsuHighlight {
  id: string;
  title: string;
  url?: string;
}

export interface OsuData {
  username: string;
  mainMode: string;
  description: string;
  highlights: readonly OsuHighlight[];
}

export type ProjectStatus = "online" | "offline" | "status unknown";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  liveUrl?: string;
  githubUrl?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  username?: string;
  url: string;
}
