import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled static export to support API routes
  // For Firebase deployment, consider using Vercel or deploying Next.js as a server
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
