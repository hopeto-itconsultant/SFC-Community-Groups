"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Splash } from "@/components/Splash";
import { useSession } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, user } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <Splash />;

  // Report forms are full-screen with their own sticky submit bar.
  const isForm = pathname.startsWith("/new/");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-slate-100 sm:shadow-xl sm:shadow-slate-300/40">
      <main
        className={`flex-1 ${isForm ? "" : "pb-[calc(5rem+env(safe-area-inset-bottom))]"}`}
      >
        {children}
      </main>
      {!isForm && <BottomNav role={user.role} />}
    </div>
  );
}
