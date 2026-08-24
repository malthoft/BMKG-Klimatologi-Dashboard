import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jdrqulgbprcfwokhpjqw.supabase.co',
      },
    ],
  },
};

export default nextConfig;
