"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { CurrentUser } from "@/data/types";
import { SHOW_NAME_SALUTATIONS } from "@/lib/config";
import { displayName } from "@/lib/format";
import { type ShellSnapshot, userFromShell, serializeShellCookie } from "@/lib/shell";

interface SessionValue {
  shell: ShellSnapshot | null;
  user: CurrentUser | null;
  hiddenSalutations: readonly string[];
  setShell: (shell: ShellSnapshot) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

/** Hands the signed-in user to Client Components. The shell cookie paints it before the server round trip. */
export function SessionProvider({
  initial,
  children,
}: {
  initial: ShellSnapshot | null;
  children: React.ReactNode;
}) {
  const [shell, setShellState] = useState<ShellSnapshot | null>(initial);
  const setShell = useCallback((next: ShellSnapshot) => {
    document.cookie = serializeShellCookie(next);
    setShellState(next);
  }, []);
  const value: SessionValue = {
    shell,
    user: shell ? userFromShell(shell) : null,
    hiddenSalutations: shell?.hidden ?? [],
    setShell,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useCurrentUser must be used inside <SessionProvider>");
  return ctx;
}

export function useShell(): ShellSnapshot | null {
  return useSession().shell;
}

/** For Client Components inside the signed-in area. Null until the shell snapshot exists. */
export function useCurrentUser(): { user: CurrentUser | null; hiddenSalutations: readonly string[] } {
  const { user, hiddenSalutations } = useSession();
  return { user, hiddenSalutations };
}

export function useSetShell(): (shell: ShellSnapshot) => void {
  return useSession().setShell;
}

/** Formats names for the signed-in person's screens, following their salutation choice. */
export function useDisplayName(): (name: string) => string {
  const { user, hiddenSalutations } = useSession();
  const show = user?.showSalutations ?? SHOW_NAME_SALUTATIONS;
  return (name) => displayName(name, show, hiddenSalutations);
}
