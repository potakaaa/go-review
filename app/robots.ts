import type { MetadataRoute } from "next";
import { PUBLIC_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/dashboard/",
    "/login",
    "/mfa",
    "/forgot-password",
    "/reset-password",
    "/auth/",
    "/r/",
  ];

  // The AI crawlers are named rather than left to the wildcard, so the answer
  // to "may we read this?" is an explicit yes in the file itself.
  const aiCrawlers = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "ClaudeBot",
    "Claude-Web",
    "Google-Extended",
    "CCBot",
    "Applebot-Extended",
    "Bytespider",
    "meta-externalagent",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${PUBLIC_ORIGIN}/sitemap.xml`,
  };
}
