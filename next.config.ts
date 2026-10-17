import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The guide page, its screenshots, and the download read these files from disk.
  outputFileTracingIncludes: {
    "/guide": ["./docs/guide/leader.html", "./docs/guide/admin.html"],
    "/guide/download": ["./docs/SFC CG Leader Guide.pdf", "./docs/SFC CGs Admin Guide.pdf"],
    "/guide/images/*": ["./docs/guide/images/**/*"],
    "/updates": ["./docs/updates.html"],
    "/updates/download": ["./docs/updates.pdf"],
  },
  // Lets phones on the home network load dev assets from http://192.168.x.x:3000.
  allowedDevOrigins: ["192.168.*.*"],
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async redirects() {
    return [{ source: "/more", destination: "/settings", permanent: false }];
  },
  experimental: {
    serverActions: {
      // Fellowship reports carry up to 3 photos, resized in the browser to well under 1 MB each.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
