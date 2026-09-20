import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  images: {
    // Public story images carry their database version in `?v=...`; keep the
    // optimizer scoped to known local media paths while allowing that version.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/media/stories/**" },
    ],
  },
  poweredByHeader: false,
  async redirects() {
    // The three per-platform tap-card pages were 96-97% identical, so they are
    // now one page with a section each. Permanent, so the old URLs pass their
    // history on rather than competing with the page that replaced them.
    return ["google", "facebook", "instagram"].map((platform) => ({
      source: `/${platform}-tap-card`,
      destination: `/tap-cards#${platform}`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  // The default dev route badge collides with the thumb navigation on small
  // viewports; compile/runtime errors still surface when this is disabled.
  devIndicators: false,
};

export default nextConfig;
