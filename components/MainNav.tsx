"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/data/types";
import { navItems, navMatches } from "./nav-config";
import { useNavPrefetch } from "./useNavPrefetch";

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
          const active = [href, ...also].some((p) => navMatches(pathname, p));
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
