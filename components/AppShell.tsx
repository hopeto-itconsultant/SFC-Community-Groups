"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Role } from "@/data/types";
import { disarmReloadBypass } from "@/lib/page-cache";
import { useShell } from "@/lib/session";
import { BottomNav, SideNav } from "./MainNav";
import { LoginAsBanner } from "./LoginAsBanner";
import { NavSkeleton } from "./page-skeletons";
import { PullToRefresh } from "./PullToRefresh";

const COMPACT_SHELL =
  "mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-slate-100 sm:shadow-xl sm:shadow-slate-300/40";

function ReloadBypass({ pathname }: { pathname: string }) {
  const first = useRef(pathname);
  useEffect(() => {
    if (first.current !== pathname) disarmReloadBypass();
  }, [pathname]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shell = useShell();
  const role: Role | undefined = shell?.role;
  const wideLayout = !!shell?.wide;
  // Report forms are full-screen with their own sticky submit bar.
  const isForm = pathname.startsWith("/new/");

  return (
    <div className={`${COMPACT_SHELL} ${wideLayout ? "md:max-w-7xl md:flex-row md:shadow-none" : ""}`}>
      <ReloadBypass pathname={pathname} />
      <PullToRefresh />
      {wideLayout && !isForm && role && <SideNav role={role} />}
      <div className="@container flex min-h-0 min-w-0 flex-1 flex-col">
        {shell?.loginAsName && <LoginAsBanner name={shell.loginAsName} />}
        <main
          className={`flex-1 ${
            isForm
              ? ""
              : wideLayout
                ? "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
                : "pb-[calc(5rem+env(safe-area-inset-bottom))]"
          }`}
        >
          {isForm && wideLayout ? <div className="mx-auto w-full max-w-xl">{children}</div> : children}
        </main>
        {!isForm && (role ? <BottomNav role={role} hiddenOnWide={wideLayout} /> : <NavSkeleton />)}
      </div>
    </div>
  );
}
