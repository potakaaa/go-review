import type { MetadataRoute } from "next";

export function GET(): Response {
  const manifest: MetadataRoute.Manifest = {
    name: "Goreview Admin",
    short_name: "Goreview",
    id: "/dashboard",
    description: "Manage Goreview cards, routes, analytics, and shop stories.",
    start_url: "/dashboard",
    scope: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "private, no-cache",
      "X-Robots-Tag": "noindex",
    },
  });
}
