"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, type SVGProps, useEffect, useState } from "react";
import type { Role } from "@/data/types";
import { PWA_NAME } from "@/lib/brand";
import { isConstrainedNetwork } from "@/lib/network";
import { isAdminRole } from "@/lib/roles";
import { FileTextIcon, GridIcon, HomeIcon, ListIcon, SettingsIcon, ShieldIcon, UsersIcon } from "./icons";

interface NavItem {
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

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function navItems(role: Role, sidebar: boolean): NavItem[] {
  const items = isAdminRole(role) ? ADMIN_NAV : LEADER_NAV;
  if (sidebar && isAdminRole(role)) {
    const settings = items.find((item) => item.href === "/settings");
    const rest = items.filter((item) => item.href !== "/settings");
    return settings ? [...rest, ...ADMIN_SIDE_EXTRA, settings] : [...items, ...ADMIN_SIDE_EXTRA];
  }
  return items;
}

function useNavPrefetch() {
  const [prefetch, setPrefetch] = useState(false);

  useEffect(() => {
    if (isConstrainedNetwork()) return;
    const id = window.setTimeout(() => setPrefetch(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  return prefetch;
}

export function SideNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItems(role, true);
  const prefetch = useNavPrefetch();

  return (
    <aside className="hidden md:flex md:w-52 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white">
      <nav aria-label="Main" className="sticky top-0 flex h-dvh flex-col overflow-y-auto p-3">
        <p className="truncate px-3 pb-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {PWA_NAME}
        </p>
        <ul className="flex flex-col gap-0.5">
          {items.map(({ href, label, icon: Icon, also = [] }) => {
            const active = [href, ...also].some((p) => matches(pathname, p));
            return (
              <li key={href}>
                <Link
                  href={href}
                  prefetch={prefetch ? null : false}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon width={20} height={20} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export function BottomNav({ role, hiddenOnWide = false }: { role: Role; hiddenOnWide?: boolean }) {
  const pathname = usePathname();
  const items = navItems(role, false);
  const prefetch = useNavPrefetch();

  return (
    <nav
      aria-label="Main"
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] ${
        hiddenOnWide ? "md:hidden" : ""
      }`}
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ href, label, icon: Icon, also = [] }) => {
          const active = [href, ...also].some((p) => matches(pathname, p));
          return (
            <li key={href}>
              <Link
                href={href}
                prefetch={prefetch ? null : false}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "text-brand-700" : "text-slate-500"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                    active ? "bg-brand-100" : ""
                  }`}
                >
                  <Icon width={22} height={22} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
