import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },

  basePath: "/GymTracker",
  assetPrefix: "/GymTracker/",
};

export default nextConfig;
