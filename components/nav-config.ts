import type { ComponentType, SVGProps } from "react";
import type { Role } from "@/data/types";
import { isAdminRole } from "@/lib/roles";
import { FileTextIcon, GridIcon, HomeIcon, ListIcon, SettingsIcon, ShieldIcon, UsersIcon } from "./icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Extra route prefixes that should highlight this tab. */
  also?: string[];
}

const LEADER_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon, also: ["/new"] },
  { href: "/group", label: "My Group", icon: UsersIcon },
  { href: "/reports", label: "Reports", icon: FileTextIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/groups", label: "Groups", icon: GridIcon },
  { href: "/reports", label: "Reports", icon: FileTextIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const ADMIN_SIDE_EXTRA: NavItem[] = [
  { href: "/people", label: "People", icon: UsersIcon },
  { href: "/admins", label: "Admins", icon: ShieldIcon },
  { href: "/activity", label: "Activity", icon: ListIcon },
];

export function navMatches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function navItems(role: Role, sidebar: boolean): NavItem[] {
  const items = isAdminRole(role) ? ADMIN_NAV : LEADER_NAV;
  if (sidebar && isAdminRole(role)) {
    const settings = items.find((item) => item.href === "/settings");
    const rest = items.filter((item) => item.href !== "/settings");
    return settings ? [...rest, ...ADMIN_SIDE_EXTRA, settings] : [...items, ...ADMIN_SIDE_EXTRA];
  }
  return items;
}
