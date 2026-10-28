"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { Role } from "@/data/types";
import { BottomNav } from "./MainNav";

const SideNav = dynamic(() => import("./SideNav").then((m) => m.SideNav));
const LoginAsBanner = dynamic(() => import("./LoginAsBanner").then((m) => m.LoginAsBanner));

const COMPACT_SHELL =
  "mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-slate-100 sm:shadow-xl sm:shadow-slate-300/40";

export function AppShell({
  role,
  loginAsName,
  wideLayout = false,
  children,
}: {
  role: Role;
  /** When set, an Admin is viewing as this person. */
  loginAsName?: string | null;
  /** Real superadmin: full-width shell from md up; compact on a phone. */
  wideLayout?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Report forms are full-screen with their own sticky submit bar.
  const isForm = pathname.startsWith("/new/");

  return (
    <div className={`${COMPACT_SHELL} ${wideLayout ? "md:max-w-7xl md:flex-row md:shadow-none" : ""}`}>
      {wideLayout && !isForm && <SideNav role={role} />}
      <div className="@container flex min-h-0 min-w-0 flex-1 flex-col">
        {loginAsName && <LoginAsBanner name={loginAsName} />}
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
        {!isForm && <BottomNav role={role} hiddenOnWide={wideLayout} />}
      </div>
    </div>
  );
}
