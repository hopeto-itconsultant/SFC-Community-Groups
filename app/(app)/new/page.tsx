"use client";

import Link from "next/link";
import { LEADER_ROLES } from "@/components/form";
import { ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { useCurrentUser } from "@/lib/session";

const OPTIONS = [
  {
    href: "/new/fellowship",
    emoji: "📝",
    title: "Fellowship Report",
    description: "Record the latest fellowship.",
  },
  {
    href: "/new/follow-up",
    emoji: "📞",
    title: "Follow-up Report",
    description: "Record a person who was followed up.",
  },
  {
    href: "/new/next-fellowship",
    emoji: "📅",
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

function NewReportChooser() {
  const { group } = useCurrentUser();
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
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl"
              aria-hidden="true"
            >
              {o.emoji}
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
