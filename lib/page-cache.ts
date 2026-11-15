import { clearShellCookieHeader } from "@/lib/shell";

const PREFIX = "sfc.page.v1:";
const BYPASS_KEY = "sfc.cache-bypass";
const REFRESH_EVENT = "sfc-page-refresh";
const MAX_CHARS = 250_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type Snapshot = { raw: string | null; data: unknown };

const snapshots = new Map<string, Snapshot>();
const listeners = new Set<() => void>();

let reloadBypassArmed = false;

function navigationIsReload(): boolean {
  if (typeof performance === "undefined") return false;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === "reload";
}

if (typeof window !== "undefined") {
  reloadBypassArmed = navigationIsReload();
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribePageCache(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") window.addEventListener(REFRESH_EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener(REFRESH_EVENT, listener);
  };
}

export function shouldBypassPageCache(): boolean {
  if (typeof window === "undefined") return false;
  if (reloadBypassArmed) return true;
  try {
    return sessionStorage.getItem(BYPASS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Later client navigations may use the cache. The reloaded page already read the bypass flag. */
export function disarmReloadBypass() {
  if (!reloadBypassArmed) return;
  reloadBypassArmed = false;
  notify();
}

function storageKey(scope: string, pageKey: string) {
  return `${PREFIX}${scope}:${pageKey}`;
}

function parseStored(raw: string | null): unknown | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { v?: number; savedAt?: number; data?: unknown };
    if (parsed.v !== 1 || parsed.data == null || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

/** Last payload for this scope and page, or null when a refresh asked to skip it. */
export function readPageCache(scope: string, pageKey: string): unknown | null {
  if (typeof window === "undefined" || shouldBypassPageCache()) return null;
  const key = storageKey(scope, pageKey);
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  const prev = snapshots.get(key);
  if (prev && prev.raw === raw) return prev.data;
  const data = parseStored(raw);
  snapshots.set(key, { raw, data });
  return data;
}

export function writePageCache(scope: string, pageKey: string, data: unknown) {
  if (typeof window === "undefined") return;
  const key = storageKey(scope, pageKey);
  let raw: string;
  try {
    raw = JSON.stringify({ v: 1, savedAt: Date.now(), data });
  } catch {
    return;
  }
  if (raw.length > MAX_CHARS) return;
  try {
    localStorage.setItem(key, raw);
  } catch {
    return;
  }
  snapshots.set(key, { raw, data });
  try {
    sessionStorage.removeItem(BYPASS_KEY);
  } catch {
    // sessionStorage can be blocked; the in-memory reload flag still clears below.
  }
  reloadBypassArmed = false;
  notify();
}

/** Drop every cached page and the display shell cookie. Call on sign-out and when login-as changes. */
export function clearPageCache() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // Ignore storage failures; the next sign-in still fetches fresh data.
  }
  snapshots.clear();
  document.cookie = clearShellCookieHeader();
  notify();
}

/** Next paint of a cached page should wait for the server instead of showing the stored copy. */
export function armFreshFetch() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BYPASS_KEY, "1");
  } catch {
    reloadBypassArmed = true;
  }
  window.dispatchEvent(new Event(REFRESH_EVENT));
  notify();
}
