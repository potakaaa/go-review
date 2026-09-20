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
      url: `${PUBLIC_ORIGIN}/tap-cards`,
      lastModified: "2026-09-20",
      changeFrequency: "monthly",
      priority: 0.9,
      images: [
        `${PUBLIC_ORIGIN}/images/google-tap-card-cutout.png`,
        `${PUBLIC_ORIGIN}/images/facebook-tap-card-cutout.png`,
        `${PUBLIC_ORIGIN}/images/instagram-tap-card-cutout.png`,
      ],
    },
    {
      url: `${PUBLIC_ORIGIN}/order`,
      lastModified: "2026-09-17",
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${PUBLIC_ORIGIN}/about`,
      lastModified: "2026-09-20",
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${PUBLIC_ORIGIN}/resellers`,
      lastModified: "2026-09-09",
      changeFrequency: "monthly",
      priority: 0.8,
      images: [REVIEW_CARD_IMAGE],
    },
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
