"use client";

import { ChevronRightIcon } from "@/components/icons";
import { useInstallApp } from "@/lib/use-install-app";

export function InstallAppLink() {
  const { installed, canInstall, note, install } = useInstallApp();

  if (installed) return null;

  const detail = !canInstall && note ? note : "Add to your home screen";

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={install}
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
