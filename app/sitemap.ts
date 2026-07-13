import type { MetadataRoute } from "next";

import { links } from "@/data/links";
import { navigation } from "@/data/navigation";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return navigation.filter((item) => !item.isSecret).map((item) => ({
    url: new URL(item.href, links.mainWebsite.url).toString(),
    changeFrequency: item.isSecret ? "yearly" : "monthly",
    priority: item.id === "home" ? 1 : item.isSecret ? 0.2 : 0.7,
  }));
}
