"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import type { Role } from "@/data/types";
import { FileTextIcon, GridIcon, HomeIcon, MenuIcon, UsersIcon } from "./icons";

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
  { href: "/more", label: "More", icon: MenuIcon },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/groups", label: "Groups", icon: GridIcon },
  { href: "/reports", label: "Reports", icon: FileTextIcon },
  { href: "/more", label: "More", icon: MenuIcon },
];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_NAV : LEADER_NAV;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ href, label, icon: Icon, also = [] }) => {
          const active = [href, ...also].some((p) => matches(pathname, p));
          return (
            <li key={href}>
              <Link
                href={href}
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
