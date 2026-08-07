import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double-mounting issues with Supabase auth
  // This resolves AbortError during getSession/getUser calls in development
  reactStrictMode: false,

  // Consistent trailing slash behavior for SEO
  trailingSlash: false,

  images: {
    // Images are transformed by Supabase Storage rather than Vercel's
    // /_next/image optimizer. See lib/imageLoader.ts for why: the Vercel
    // optimizer is metered, and when the allowance ran out it answered
    // HTTP 402 for most product photos, which the browser renders as a
    // broken image. Supabase's transformer is not metered per request,
    // so that failure mode is gone rather than merely postponed.
    //
    // `loader: "custom"` also means no image request touches the Vercel
    // optimizer at all — nothing to run out of.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",

    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    // Next.js 16 only serves qualities listed here (default [75]); anything else
    // is rejected with a 400. These are the values used across the app.
    qualities: [70, 75, 80],
    // NOTE: `formats` and `minimumCacheTTL` are settings for the built-in
    // optimizer and have no effect with a custom loader. WebP is instead
    // negotiated by Supabase from the browser's Accept header, and cache
    // lifetime comes from Supabase's own Cache-Control plus Cloudflare.
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

  // SEO-friendly security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Aggressively cache all static images and public assets
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400, immutable",
          },
        ],
      },
      {
        source: "/(.*)\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
