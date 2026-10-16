"use client";

import { usePathname } from "next/navigation";
import type { Role } from "@/data/types";
import { BottomNav } from "./BottomNav";
import { LoginAsBanner } from "./LoginAsBanner";

export function AppShell({
  role,
  loginAsName,
  children,
}: {
  role: Role;
  /** When set, an Admin is viewing as this person. */
  loginAsName?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Report forms are full-screen with their own sticky submit bar.
  const isForm = pathname.startsWith("/new/");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-slate-100 sm:shadow-xl sm:shadow-slate-300/40">
      {loginAsName && <LoginAsBanner name={loginAsName} />}
      <main className={`flex-1 ${isForm ? "" : "pb-[calc(5rem+env(safe-area-inset-bottom))]"}`}>
        {children}
      </main>
      {!isForm && <BottomNav role={role} />}
    </div>
  );
}
