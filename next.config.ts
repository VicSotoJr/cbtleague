import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/cbtleague',
  assetPrefix: '/cbtleague',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
