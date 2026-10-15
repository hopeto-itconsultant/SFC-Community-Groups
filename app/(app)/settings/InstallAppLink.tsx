"use client";

import { useEffect, useState } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { canPromptInstall, promptInstall } from "@/lib/pwa-install";

function runningInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function manualInstallNote() {
  if (isIos()) return "Share, then Add to Home Screen.";
  return "Use the browser menu to install.";
}

export function InstallAppLink() {
  const [installed, setInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (runningInstalled()) {
      setInstalled(true);
      return;
    }

    const sync = () => setCanInstall(canPromptInstall());
    sync();
    if (!canPromptInstall() && isIos()) setNote(manualInstallNote());

    const onAvailable = () => setCanInstall(true);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("pwa-install-available", onAvailable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa-install-available", onAvailable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function onInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setInstalled(true);
      return;
    }
    setNote(manualInstallNote());
    setCanInstall(canPromptInstall());
  }

  const detail = !canInstall && note ? note : "Add to your home screen";

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onInstall}
        className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Install app</span>
          <span className="block text-sm text-slate-500">{detail}</span>
        </span>
        <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
      </button>
    </div>
  );
}
