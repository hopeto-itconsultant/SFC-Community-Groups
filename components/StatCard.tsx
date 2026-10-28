import Link from "next/link";
import { ChevronRightIcon } from "./icons";
import { Card } from "./ui";

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium leading-tight text-slate-500">{label}</p>
        {href && <ChevronRightIcon width={14} height={14} className="shrink-0 text-slate-400" />}
      </div>
      <p className="mt-1 text-2xl font-bold text-brand-700">{value}</p>
    </>
  );

  if (!href) return <Card className="flex flex-col justify-between px-3 py-2.5">{body}</Card>;
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex flex-col justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      {body}
    </Link>
  );
}
