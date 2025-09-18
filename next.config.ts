import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reduce client JavaScript by tree-shaking large icon packages
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Fine-tune responsive sizing for better mobile srcset selection
    deviceSizes: [320, 360, 375, 390, 414, 430, 480, 540, 600, 640, 750, 828, 1080],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256],
    // Prefer modern formats when supported
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.ctfassets.net' },
      { protocol: 'https', hostname: 'downloads.ctfassets.net' },
      { protocol: 'https', hostname: 'images.contentful.com' },
    ],
  },
};

export default nextConfig;
