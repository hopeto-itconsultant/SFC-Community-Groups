"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { IPHONE_INSTALL_VIDEO, useInstallApp } from "@/lib/use-install-app";
import { XIcon } from "./icons";

// Kept in memory, not sessionStorage: mobile browsers restore sessionStorage with the tab,
// so a dismissal there would outlive closing and reopening the app.
let dismissedThisLoad = false;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismiss() {
  dismissedThisLoad = true;
  listeners.forEach((l) => l());
}

/** Home-screen install prompt; the X hides it until the app is reopened. */
export function InstallBanner({ className = "" }: { className?: string }) {
  const { installed, canInstall, ios, install } = useInstallApp();
  const dismissed = useSyncExternalStore(
    subscribe,
    () => dismissedThisLoad,
    () => false,
  );

  if (installed || dismissed || !(canInstall || ios)) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-3 pr-1.5 shadow-sm ring-1 ring-slate-200/70 ${className}`}
    >
      <Image
        src="/brand/icon-192.png"
        alt=""
        width={32}
        height={32}
        unoptimized
        className="shrink-0 rounded-lg"
      />
      <p className="min-w-0 flex-1 leading-tight">
        <span className="font-bold">Install app</span>{" "}
        <span className="text-xs text-slate-500">
          {canInstall ? "Add to home screen" : "Share, then Add to Home Screen"}
        </span>
      </p>
      {canInstall ? (
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
        >
          Install
        </button>
      ) : (
        <a
          href={IPHONE_INSTALL_VIDEO}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
        >
          Watch how
        </a>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide install banner"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
      >
        <XIcon width={18} height={18} />
      </button>
    </div>
  );
}
