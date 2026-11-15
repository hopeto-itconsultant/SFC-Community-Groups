"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  armFreshFetch,
  readPageCache,
  subscribePageCache,
  writePageCache,
} from "@/lib/page-cache";
import { scopeKeyFromShell } from "@/lib/shell";
import { useShell } from "@/lib/session";

function useCachedPayload(scope: string | null, pageKey: string) {
  return useSyncExternalStore(
    subscribePageCache,
    () => (scope ? readPageCache(scope, pageKey) : null),
    () => null,
  );
}

/**
 * Shows the last copy of a safe read-only page at once, then swaps in the server render.
 * A hard reload, pull-to-refresh, or Refresh skips that copy.
 */
export function CachedPage({
  pageKey,
  skeleton,
  render,
  children,
}: {
  pageKey: string;
  skeleton: ReactNode;
  render: (data: unknown) => ReactNode | null;
  children: ReactNode;
}) {
  const shell = useShell();
  const scope = shell ? scopeKeyFromShell(shell) : null;
  const cached = useCachedPayload(scope, pageKey);
  const [fresh, setFresh] = useState(false);
  const markFresh = useCallback(() => setFresh(true), []);
  const cachedView = cached == null || fresh ? null : render(cached);
  const showingCache = cachedView != null;

  return (
    <div className="relative">
      <RefreshControl stale={showingCache} />
      <Suspense fallback={showingCache ? cachedView : skeleton}>
        <FreshMarker onFresh={markFresh}>{children}</FreshMarker>
      </Suspense>
    </div>
  );
}

function FreshMarker({ onFresh, children }: { onFresh: () => void; children: ReactNode }) {
  useEffect(() => {
    onFresh();
  }, [onFresh]);
  return children;
}

function RefreshControl({ stale }: { stale: boolean }) {
  const router = useRouter();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center">
      <button
        type="button"
        className="pointer-events-auto rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-md ring-1 ring-slate-200 disabled:text-slate-400"
        disabled={stale}
        onClick={() => {
          if (stale) return;
          armFreshFetch();
          router.refresh();
        }}
      >
        {stale ? "Updating…" : "Refresh"}
      </button>
    </div>
  );
}

/** Remembers the server payload for the next visit. Renders nothing of its own. */
export function CacheCommit({
  scopeKey,
  pageKey,
  data,
  children,
}: {
  scopeKey: string;
  pageKey: string;
  data: unknown;
  children: ReactNode;
}) {
  useEffect(() => {
    writePageCache(scopeKey, pageKey, data);
  }, [scopeKey, pageKey, data]);
  return children;
}
