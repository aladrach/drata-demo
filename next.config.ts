import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.ctfassets.net' },
      { protocol: 'https', hostname: 'downloads.ctfassets.net' },
      { protocol: 'https', hostname: 'images.contentful.com' },
    ],
  },
};

export default nextConfig;
