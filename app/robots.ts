import type { MetadataRoute } from "next";

import { links } from "@/data/links";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", links.mainWebsite.url).toString(),
  };
}
