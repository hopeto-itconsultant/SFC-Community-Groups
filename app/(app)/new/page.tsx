import Link from "next/link";
import type { ReactNode } from "react";
import { LEADER_ROLES } from "@/components/form";
import { CalendarIcon, ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";

const OPTIONS: { href: string; title: string; description: string; icon: ReactNode }[] = [
  {
    href: "/new/fellowship",
    icon: "📝",
    title: "Fellowship Report",
    description: "Record the latest fellowship.",
  },
  {
    href: "/new/follow-up",
    icon: "📞",
    title: "Follow-up Report",
    description: "Record a person who was followed up.",
  },
  {
    href: "/new/next-fellowship",
    icon: <CalendarIcon width={32} height={32} />,
    title: "Next Fellowship",
    description: "Plan the upcoming fellowship.",
  },
];

export default function NewReportPage() {
  return (
    <RoleGate allow={LEADER_ROLES}>
      <NewReportChooser />
    </RoleGate>
  );
}

async function NewReportChooser() {
  const user = await requireUser();
  const group = await getGroupById(user.groupId);
  return (
    <>
      <PageHeader title="New Report" subtitle={group?.name} backHref="/home" />
      <div className="space-y-3 p-4">
        {OPTIONS.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 active:bg-brand-50"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl text-brand-700"
              aria-hidden="true"
            >
              {o.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">{o.title}</span>
              <span className="block text-slate-500">{o.description}</span>
            </span>
            <ChevronRightIcon className="shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
    </>
  );
}
