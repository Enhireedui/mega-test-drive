import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /* Pin tracing to this project; an unrelated lockfile sits higher up the tree. */
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 828, 1080, 1200, 1440, 1920, 2048],
    qualities: [75, 82],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
