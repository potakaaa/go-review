import type { MetadataRoute } from "next";
import { PUBLIC_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/login",
        "/mfa",
        "/forgot-password",
        "/reset-password",
        "/auth/",
        "/r/",
      ],
    },
    sitemap: `${PUBLIC_ORIGIN}/sitemap.xml`,
  };
}
