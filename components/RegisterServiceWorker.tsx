"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "@/lib/use-install-app";

/** Installed-app cache. Left off in development so a worker cannot pin stale pages. */
export function RegisterServiceWorker() {
  useEffect(() => {
    listenForInstallPrompt();
    if (!("serviceWorker" in navigator)) return;
    // Dev chunk URLs stay the same while their contents change. A worker left
    // over from a production session would keep serving the old install hook.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
