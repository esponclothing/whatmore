import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
      allowedOrigins: ["whatsapp.esponsports.com", "*.railway.app", "localhost:3000"]
    }
  }
};

export default nextConfig;
