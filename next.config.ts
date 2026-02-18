import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.foodandwine.com',
      },
      {
        protocol: 'https',
        hostname: 'www.wandercooks.com',
      },
      {
        protocol: 'https',
        hostname: 'fullofplants.com',
      },
    ],
  },
};

export default nextConfig;
