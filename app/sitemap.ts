import type { MetadataRoute } from "next";

import { site } from "@/data/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/commission/", site.url).toString(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
