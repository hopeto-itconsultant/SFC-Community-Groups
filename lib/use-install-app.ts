"use client";

import { useState, useSyncExternalStore } from "react";
import {
  INSTALL_CHANGE_EVENT,
  canPromptInstall,
  isInstalled,
  isIos,
  manualInstallNote,
  promptInstall,
} from "./pwa-install";

function subscribe(listener: () => void) {
  window.addEventListener(INSTALL_CHANGE_EVENT, listener);
  return () => window.removeEventListener(INSTALL_CHANGE_EVENT, listener);
}

function noSubscribe() {
  return () => {};
}

const serverFalse = () => false;

export function useInstallApp() {
  const installed = useSyncExternalStore(subscribe, isInstalled, serverFalse);
  const canInstall = useSyncExternalStore(subscribe, canPromptInstall, serverFalse);
  const ios = useSyncExternalStore(noSubscribe, isIos, serverFalse);
  const [failedNote, setFailedNote] = useState<string | null>(null);

  async function install() {
    const outcome = await promptInstall();
    if (outcome !== "accepted") setFailedNote(manualInstallNote());
  }

  const note = failedNote ?? (ios && !canInstall ? manualInstallNote() : null);

  return { installed, canInstall, ios, note, install };
}
