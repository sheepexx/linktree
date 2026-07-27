import type { Metadata } from "next";

import { CommissionFlow } from "@/components/commission/CommissionFlow";
import { site } from "@/data/site";

const description =
  "Configure an art or GFX commission, get a live estimate, and send your request to sheepex_.";

export const metadata: Metadata = {
  title: "Commission request",
  description,
  alternates: {
    canonical: "/commission/",
  },
  openGraph: {
    type: "website",
    title: "Commission request",
    description,
    url: "/commission/",
    images: [
      {
        url: site.seo.socialPreview,
        width: 1200,
        height: 630,
        alt: `Commission requests for ${site.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Commission request",
    description,
    images: [site.seo.socialPreview],
  },
};

export default function CommissionPage() {
  return <CommissionFlow />;
}
