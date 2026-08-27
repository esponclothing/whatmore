import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  serverActions: {
    bodySizeLimit: "20mb"
  }
};

export default nextConfig;
