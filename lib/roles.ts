import type { Role } from "@/data/types";

/** Admin capabilities: normal admin or superadmin. */
export function isAdminRole(role: Role): boolean {
  return role === "admin" || role === "superadmin";
}

/** Superadmin-only capabilities (login-as, activity log). */
export function isSuperAdmin(role: Role): boolean {
  return role === "superadmin";
}
