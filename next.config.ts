import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The default dev route badge collides with the thumb navigation on small
  // viewports; compile/runtime errors still surface when this is disabled.
  devIndicators: false,
};

export default nextConfig;
