import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Collections also answer at their .json names.
    return [
      { source: "/api/combinations.json", destination: "/api/combinations" },
      { source: "/api/colours.json", destination: "/api/colours" },
    ];
  },
  async redirects() {
    // Accept unpadded plate numbers (/combinations/7 → /combinations/007).
    return [
      { source: "/combinations/:id(\\d)", destination: "/combinations/00:id", permanent: true },
      { source: "/combinations/:id(\\d\\d)", destination: "/combinations/0:id", permanent: true },
      { source: "/ja/combinations/:id(\\d)", destination: "/ja/combinations/00:id", permanent: true },
      { source: "/ja/combinations/:id(\\d\\d)", destination: "/ja/combinations/0:id", permanent: true },
      { source: "/colors/:path*", destination: "/colours/:path*", permanent: true },
      { source: "/ja/colors/:path*", destination: "/ja/colours/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
