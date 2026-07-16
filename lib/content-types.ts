export type GalleryCategory = "art" | "gfx";

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  image: {
    src: string;
    alt: string;
  };
  description?: string;
  href?: string;
  aspect?: string;
  wide?: boolean;
}

export interface OsuData {
  username: string;
  mainMode: string;
  description: string;
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
