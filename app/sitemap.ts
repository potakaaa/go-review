import type { MetadataRoute } from "next";

import { guides } from "@/lib/guides";
import { seoLandingPages } from "@/lib/seo-pages";
import { REVIEW_CARD_IMAGE, SEO_IMAGE } from "@/lib/seo";
import { PUBLIC_ORIGIN } from "@/lib/site";

const latestGuideUpdate = guides.reduce(
  (latest, guide) => (guide.updatedAt > latest ? guide.updatedAt : latest),
  "1970-01-01",
);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: PUBLIC_ORIGIN,
      changeFrequency: "monthly",
      priority: 1,
      images: [REVIEW_CARD_IMAGE],
    },
    ...seoLandingPages.map((page) => ({
      url: `${PUBLIC_ORIGIN}${page.path}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: page.path === "/google-review-card" ? 0.9 : 0.8,
      images: [REVIEW_CARD_IMAGE],
    })),
    {
      url: `${PUBLIC_ORIGIN}/guides`,
      lastModified: latestGuideUpdate,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [SEO_IMAGE],
    },
    ...guides.map((guide) => ({
      url: `${PUBLIC_ORIGIN}/guides/${guide.slug}`,
      lastModified: guide.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [SEO_IMAGE],
    })),
  ];
}
