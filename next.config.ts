import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double-mounting issues with Supabase auth
  // This resolves AbortError during getSession/getUser calls in development
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'vabvgifhyktqloplhwtc.supabase.co',
      },
    ],
  },
};

export default nextConfig;
