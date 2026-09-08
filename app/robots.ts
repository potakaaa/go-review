import type { MetadataRoute } from "next";
import { PUBLIC_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Do not advertise private paths in this public document.
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${PUBLIC_ORIGIN}/sitemap.xml` };
}
