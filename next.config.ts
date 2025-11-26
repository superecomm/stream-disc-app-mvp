import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/Cloud Run deployment
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
