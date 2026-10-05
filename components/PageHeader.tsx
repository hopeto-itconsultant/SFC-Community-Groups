import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex min-h-14 items-center gap-1 px-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-slate-700 active:bg-slate-100"
          >
            <ChevronLeftIcon />
          </Link>
        ) : (
          <div className="w-2" />
        )}
        <div className="min-w-0 flex-1 py-2">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 pr-2">{action}</div>}
      </div>
    </header>
  );
}
