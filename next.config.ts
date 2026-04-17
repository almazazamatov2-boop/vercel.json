import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/overlays',
        destination: '/overlays/index.html',
      },
      {
        source: '/overlays/dashboard',
        destination: '/overlays/dashboard.html',
      },
      {
        source: '/overlays/roll',
        destination: '/overlays/roll.html',
      },
    ]
  },
};

export default nextConfig;
