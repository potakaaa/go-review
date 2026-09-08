import type { MetadataRoute } from "next";

import { guides } from "@/lib/guides";
import { seoLandingPages } from "@/lib/seo-pages";
import { PUBLIC_ORIGIN } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: PUBLIC_ORIGIN,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...seoLandingPages.map((page) => ({
      url: `${PUBLIC_ORIGIN}${page.path}`,
      changeFrequency: "monthly" as const,
      priority: page.path === "/google-review-card" ? 0.9 : 0.8,
    })),
    {
      url: `${PUBLIC_ORIGIN}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...guides.map((guide) => ({
      url: `${PUBLIC_ORIGIN}/guides/${guide.slug}`,
      lastModified: guide.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
