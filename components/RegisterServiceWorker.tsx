"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "@/lib/pwa-install";

/** Installed-app cache. Left off in development so a worker cannot pin stale pages. */
export function RegisterServiceWorker() {
  useEffect(() => {
    listenForInstallPrompt();
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
