"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { CommunityGroup, User } from "@/data/types";
import { getGroupById, getUserById } from "./data-access";

const STORAGE_KEY = "sfc-demo-user";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

function getSnapshot(): string | null {
  return window.sessionStorage.getItem(STORAGE_KEY);
}

/** `undefined` on the server and during hydration means "not known yet". */
function getServerSnapshot(): string | null | undefined {
  return undefined;
}

interface SessionValue {
  /** False until the stored demo user has been read on the client. */
  ready: boolean;
  user: User | undefined;
  group: CommunityGroup | undefined;
  login: (userId: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const userId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback((id: string) => {
    window.sessionStorage.setItem(STORAGE_KEY, id);
    notify();
  }, []);

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    notify();
  }, []);

  const value = useMemo<SessionValue>(() => {
    const user = getUserById(userId ?? undefined);
    return {
      ready: userId !== undefined,
      user,
      group: getGroupById(user?.groupId),
      login,
      logout,
    };
  }, [userId, login, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** For screens inside the signed-in area, where the layout guarantees a user. */
export function useCurrentUser(): { user: User; group: CommunityGroup | undefined } {
  const { user, group } = useSession();
  if (!user) throw new Error("useCurrentUser called without a signed-in user");
  return { user, group };
}
