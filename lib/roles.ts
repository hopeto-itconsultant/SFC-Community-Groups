import type { Role } from "@/data/types";

/** Admin capabilities: normal admin or superadmin. */
export function isAdminRole(role: Role): boolean {
  return role === "admin" || role === "superadmin";
}

/** Superadmin-only capabilities (login-as, activity log, delete reports). */
export function isSuperAdmin(role: Role): boolean {
  return role === "superadmin";
}
