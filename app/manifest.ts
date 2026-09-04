import type { MetadataRoute } from "next";

/**
 * Add-to-Home-Screen support, so the dashboard opens full-screen from the
 * phone's home screen during a sales visit.
 *
 * Deliberately no service worker: its scope would cover /r/*, and a cached
 * redirect is precisely the failure this product exists to prevent.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Review Routes",
    short_name: "Review Routes",
    id: "/dashboard",
    description:
      "Manage the permanent QR and NFC links printed on Google Review cards.",
    start_url: "/dashboard",
    scope: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
