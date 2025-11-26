import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Firebase Hosting
  // Note: This disables API routes. Use Firebase Functions for API endpoints if needed.
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
