"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, type SVGProps, useEffect, useState } from "react";
import type { Role } from "@/data/types";
import { isConstrainedNetwork } from "@/lib/network";
import { isAdminRole } from "@/lib/roles";
import { FileTextIcon, GridIcon, HomeIcon, SettingsIcon, UsersIcon } from "./icons";

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

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = isAdminRole(role) ? ADMIN_NAV : LEADER_NAV;
  // Tabs prefetch only once the open screen has loaded, and never on slow or data-saver connections.
  const [prefetch, setPrefetch] = useState(false);

  useEffect(() => {
    if (isConstrainedNetwork()) return;
    const id = window.setTimeout(() => setPrefetch(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
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
