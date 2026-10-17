import type { MetadataRoute } from "next";
import { PWA_NAME, THEME_COLOR } from "@/lib/brand";

/** Installed-app name (home screen and the browser's "couldn't load" page). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_NAME,
    short_name: PWA_NAME,
    description: "Community Groups management and reporting",
    id: "/",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: THEME_COLOR,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
