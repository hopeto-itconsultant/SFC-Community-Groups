"use client";

import { createContext, useContext } from "react";
import type { CommunityGroup, CurrentUser } from "@/data/types";
import { displayName } from "@/lib/format";

interface SessionValue {
  user: CurrentUser;
  group: CommunityGroup | undefined;
}

const SessionContext = createContext<SessionValue | null>(null);

/** Hands the signed-in user, loaded on the server by the app layout, to Client Components. */
export function SessionProvider({
  user,
  group,
  children,
}: SessionValue & { children: React.ReactNode }) {
  return <SessionContext.Provider value={{ user, group }}>{children}</SessionContext.Provider>;
}

/** For Client Components inside the signed-in area, where the layout guarantees a user. */
export function useCurrentUser(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useCurrentUser must be used inside <SessionProvider>");
  return ctx;
}

/** Formats names for the signed-in person's screens, following their salutation choice. */
export function useDisplayName(): (name: string) => string {
  const { user } = useCurrentUser();
  return (name) => displayName(name, user.showSalutations);
}
