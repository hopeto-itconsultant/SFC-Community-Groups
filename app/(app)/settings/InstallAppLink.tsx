"use client";

import Image from "next/image";
import { ChevronRightIcon } from "@/components/icons";
import { IPHONE_INSTALL_VIDEO, useInstallApp } from "@/lib/use-install-app";

export function InstallAppLink() {
  const { installed, canInstall, ios, note, install } = useInstallApp();

  if (installed) return null;

  const detail = !canInstall && note ? note : "Add to your home screen";
  const showVideo = ios && !canInstall;

  const body = (
    <>
      <Image
        src="/brand/icon-192.png"
        alt=""
        width={40}
        height={40}
        unoptimized
        className="shrink-0 rounded-xl"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Install app</span>
        <span className="block text-sm text-slate-500">{detail}</span>
        {showVideo && (
          <a
            href={IPHONE_INSTALL_VIDEO}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm font-semibold text-brand-700"
          >
            Watch how
          </a>
        )}
      </span>
      {!showVideo && <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />}
    </>
  );

  return (
    <div className="mt-3">
      {showVideo ? (
        <div className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70">
          {body}
        </div>
      ) : (
        <button
          type="button"
          onClick={install}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
        >
          {body}
        </button>
      )}
    </div>
  );
}
