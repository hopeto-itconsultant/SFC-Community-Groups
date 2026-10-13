"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { CommunityGroup, User } from "@/data/types";
import { toISODate } from "./format";
import { getGroupById, getUserById } from "./data-access";
import { userCookieAssignment, userIdFromCookieHeader } from "./user-cookie";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("focus", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("focus", listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

function readUserId(): string | null {
  return userIdFromCookieHeader(document.cookie);
}

function writeUserCookie(id: string | null) {
  const secure = window.location.protocol === "https:";
  document.cookie = userCookieAssignment(id, secure);
}

function subscribeToday() {
  return () => {};
}

/** Phone-local calendar day. Runs only after hydration, then date-based UI can catch up. */
function readLocalToday(): string {
  const local = toISODate(new Date());
  window.__SFC_TODAY__ = local;
  return local;
}

interface SessionValue {
  /** False only before the signed-in user is known. With a server-rendered cookie this is immediate. */
  ready: boolean;
  user: User | undefined;
  group: CommunityGroup | undefined;
  login: (userId: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  initialUserId,
  initialToday,
  children,
}: {
  initialUserId: string | null;
  /** Calendar day used to render this response. Kept for hydration, then corrected to the phone's day. */
  initialToday: string;
  children: React.ReactNode;
}) {
  if (typeof window !== "undefined") window.__SFC_TODAY__ ??= initialToday;

  const userId = useSyncExternalStore(subscribe, readUserId, () => initialUserId);
  const today = useSyncExternalStore(subscribeToday, readLocalToday, () => initialToday);

  const login = useCallback((id: string) => {
    writeUserCookie(id);
    notify();
  }, []);

  const logout = useCallback(() => {
    writeUserCookie(null);
    notify();
  }, []);

  const value = useMemo<SessionValue>(() => {
    // `today` invalidates this value when the phone's calendar day replaces the server day.
    void today;
    const user = getUserById(userId ?? undefined);
    return {
      ready: true,
      user,
      group: getGroupById(user?.groupId),
      login,
      logout,
    };
  }, [userId, login, logout, today]);

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
