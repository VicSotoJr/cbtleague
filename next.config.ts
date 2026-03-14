import { existsSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const hasCustomDomain = existsSync(join(process.cwd(), "public", "CNAME"));
const publicBasePath = isProd && !hasCustomDomain ? "/cbtleague" : "";

const nextConfig: NextConfig = {
  output: "export",
  // Custom-domain deployments are served from the domain root, not /<repo>.
  basePath: publicBasePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: publicBasePath,
  },
};

export default nextConfig;
