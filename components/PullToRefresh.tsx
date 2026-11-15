"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { armFreshFetch } from "@/lib/page-cache";

const CACHED_PATHS = new Set(["/home", "/group", "/groups", "/reports"]);

const TRIGGER = 72;

/** Pull down at the top of the page to load a fresh copy, including in the installed app. */
export function PullToRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const enabled = CACHED_PATHS.has(pathname);
  const startY = useRef(0);
  const pulling = useRef(false);
  const distance = useRef(0);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      if (!enabled || window.scrollY > 0 || refreshing) return;
      pulling.current = true;
      startY.current = event.touches[0]?.clientY ?? 0;
      distance.current = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (!pulling.current) return;
      const y = event.touches[0]?.clientY ?? 0;
      const next = Math.max(0, y - startY.current);
      if (next <= 0 || window.scrollY > 0) {
        distance.current = 0;
        setOffset(0);
        return;
      }
      distance.current = Math.min(next, 110);
      setOffset(distance.current);
    };
    const onEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      const pulled = distance.current;
      distance.current = 0;
      setOffset(0);
      if (pulled < TRIGGER) return;
      setRefreshing(true);
      armFreshFetch();
      router.refresh();
      window.setTimeout(() => setRefreshing(false), 600);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [enabled, refreshing, router]);

  if (!enabled || (offset < 16 && !refreshing)) return null;
  return (
    <p className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-40 pt-2 text-center text-xs font-semibold text-slate-500">
      {offset >= TRIGGER || refreshing ? "Updating…" : "Pull to refresh"}
    </p>
  );
}
