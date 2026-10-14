import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Fellowship reports carry up to 3 photos, resized in the browser to well under 1 MB each.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
