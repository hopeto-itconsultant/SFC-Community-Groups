import type { CurrentUser, Role } from "@/data/types";

/** Display-only snapshot so the app chrome can paint before Supabase answers. Not used for access checks. */
export const SHELL_COOKIE = "sfc-shell";

const ROLES: readonly Role[] = ["superadmin", "admin", "leader", "asst-leader"];
const MAX_AGE = 60 * 60 * 24 * 30;

export interface ShellSnapshot {
  id: string;
  name: string;
  role: Role;
  groupId?: string;
  showSalutations: boolean;
  /** Set while a superadmin is viewing as this profile. */
  loginAsId: string | null;
  loginAsName: string | null;
  /** Real signed-in person is a superadmin, so the wide desktop shell applies. */
  wide: boolean;
  hidden: string[];
}

export function userFromShell(shell: ShellSnapshot): CurrentUser {
  return {
    id: shell.id,
    name: shell.name,
    role: shell.role,
    groupId: shell.groupId,
    showSalutations: shell.showSalutations,
  };
}

/** profile id + role + login-as target. Shared by the shell cookie and the page cache. */
export function scopeKeyFromShell(shell: ShellSnapshot): string {
  return `${shell.id}:${shell.role}:${shell.loginAsId ?? ""}`;
}

export function scopeKeyForUser(user: { id: string; role: string }, loginAsId: string | null): string {
  return `${user.id}:${user.role}:${loginAsId ?? ""}`;
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

function snapshotFromJson(raw: string): ShellSnapshot | null {
  try {
    const value = JSON.parse(raw) as Partial<ShellSnapshot>;
    if (!value || typeof value.id !== "string" || !value.id || typeof value.name !== "string" || !isRole(value.role)) {
      return null;
    }
    return {
      id: value.id,
      name: value.name,
      role: value.role,
      groupId: typeof value.groupId === "string" ? value.groupId : undefined,
      showSalutations: value.showSalutations !== false,
      loginAsId: typeof value.loginAsId === "string" && value.loginAsId ? value.loginAsId : null,
      loginAsName: typeof value.loginAsName === "string" && value.loginAsName ? value.loginAsName : null,
      wide: value.wide === true,
      hidden: Array.isArray(value.hidden) ? value.hidden.filter((item) => typeof item === "string").slice(0, 40) : [],
    };
  } catch {
    return null;
  }
}

export function parseShellSnapshot(raw: string | undefined | null): ShellSnapshot | null {
  if (!raw) return null;
  const direct = snapshotFromJson(raw);
  if (direct) return direct;
  try {
    return snapshotFromJson(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function serializeShellCookie(shell: ShellSnapshot): string {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  const value = encodeURIComponent(JSON.stringify(shell));
  return `${SHELL_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearShellCookieHeader(): string {
  return `${SHELL_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
