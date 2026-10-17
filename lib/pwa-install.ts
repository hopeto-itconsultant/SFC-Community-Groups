"use client";

import { listenForInstallPrompt as startListening } from "./use-install-app";

/** Same listener as the install hook. Kept so older screens can still start it. */
export function listenForInstallPrompt() {
  startListening();
}
