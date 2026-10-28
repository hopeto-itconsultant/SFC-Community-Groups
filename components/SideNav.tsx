"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/data/types";
import { PWA_NAME } from "@/lib/brand";
import { navItems, navMatches } from "./nav-config";
import { useNavPrefetch } from "./useNavPrefetch";

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
            const active = [href, ...also].some((p) => navMatches(pathname, p));
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
