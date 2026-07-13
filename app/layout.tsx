import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/SiteShell";
import { links } from "@/data/links";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(links.mainWebsite.url),
  title: {
    default: "SHEEPEX — art, GFX, osu! and internet projects",
    template: "%s // SHEEPEX",
  },
  description: "A personal archive for art, GFX, osu!, rhythm games, videos, tools and other internet projects.",
  applicationName: "SHEEPEX archive",
  authors: [{ name: "sheepex_", url: links.mainWebsite.url }],
  creator: "sheepex_",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "SHEEPEX archive",
    title: "SHEEPEX — art, GFX, osu! and internet projects",
    description: "A personal archive for art, GFX, osu!, rhythm games, videos, tools and other internet projects.",
    url: "/",
    images: [
      {
        url: "/social-preview-placeholder.png",
        width: 1200,
        height: 630,
        alt: "SHEEPEX archive social preview placeholder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SHEEPEX — art, GFX, osu! and internet projects",
    description: "A personal archive for art, GFX, osu!, rhythm games, videos, tools and other internet projects.",
    images: ["/social-preview-placeholder.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111416",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
