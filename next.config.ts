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
  async redirects() {
    // Accept unpadded plate numbers (/combinations/7 → /combinations/007).
    return [
      { source: "/combinations/:id(\\d)", destination: "/combinations/00:id", permanent: true },
      { source: "/combinations/:id(\\d\\d)", destination: "/combinations/0:id", permanent: true },
      { source: "/colors/:path*", destination: "/colours/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
