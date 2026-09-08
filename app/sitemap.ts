import type { MetadataRoute } from "next";
import { PUBLIC_ORIGIN } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: PUBLIC_ORIGIN, changeFrequency: "monthly", priority: 1 }];
}
