"use client";

import dynamic from "next/dynamic";

const Analytics = dynamic(() => import("@vercel/analytics/next").then((m) => m.Analytics), {
  ssr: false,
});

/** Loaded after hydration so the analytics script is off the first-paint path. */
export function DeferredAnalytics() {
  return <Analytics />;
}
