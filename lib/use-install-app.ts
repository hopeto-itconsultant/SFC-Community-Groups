"use client";

import { useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const INSTALL_CHANGE_EVENT = "pwa-install-change";

let deferred: BeforeInstallPromptEvent | null = null;
let installedHere = false;
let listening = false;

function notifyChange() {
  window.dispatchEvent(new Event(INSTALL_CHANGE_EVENT));
}

/** Captures the browser install prompt so Home and Settings can open it later. */
export function listenForInstallPrompt() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notifyChange();
  });
  window.addEventListener("appinstalled", () => {
    installedHere = true;
    deferred = null;
    notifyChange();
  });
}

export function canPromptInstall() {
  return deferred !== null;
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const prompt = deferred;
  if (!prompt) return "unavailable";
  deferred = null;
  notifyChange();
  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      installedHere = true;
      notifyChange();
    }
    return outcome;
  } catch {
    return "unavailable";
  }
}

/** True when running as the installed app, or once it was installed from this tab. */
export function isInstalled() {
  return (
    installedHere ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function manualInstallNote() {
  if (isIos()) return "Share, then Add to Home Screen.";
  return "Use the browser menu to install.";
}

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

if (typeof window !== "undefined") listenForInstallPrompt();
