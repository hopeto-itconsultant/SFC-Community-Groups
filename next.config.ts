import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fellowship reports carry up to 3 photos, resized in the browser to well under 1 MB each.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
