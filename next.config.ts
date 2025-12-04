import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Cloud Run deployment
  // This allows API routes to work and creates a minimal production bundle
  output: 'standalone',
  // Images can be optimized in standalone mode
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
