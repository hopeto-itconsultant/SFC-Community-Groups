"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CommunityGroup, User } from "@/data/types";
import { GroupMiniCard, GroupSummaryRow, StatCard } from "@/components/groups";
import { CalendarIcon, ChevronRightIcon, FileTextIcon } from "@/components/icons";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { ViewToggle, useStoredView } from "@/components/ViewToggle";
import {
  getGroups,
  getLastFellowship,
  getNextFellowship,
  getReportTypeSummaries,
  getReportsFiledThisMonth,
  getUpcomingFellowships,
} from "@/lib/data-access";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { ROLE_LABELS, formatRupees, formatShortDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

export default function HomePage() {
  const { user, group } = useCurrentUser();
  if (user.role === "admin") return <AdminHome user={user} />;
  if (!group) return null;
  return <LeaderHome user={user} group={group} />;
}

function Hero({ user, subtitle }: { user: User; subtitle?: string }) {
  return (
    <div className="bg-brand-700 px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-100">
        <Image src={LOGO_SRC} alt="" width={24} height={24} className="rounded-md ring-1 ring-white/30" />
        {APP_NAME}
      </div>
      <h1 className="mt-3 truncate text-base font-semibold leading-tight">
        <span className="font-normal text-brand-100">Welcome </span>
        {user.name}
      </h1>
      {subtitle && (
        <div className="mt-1 flex items-center gap-2">
          <span className="truncate font-semibold">{subtitle}</span>
          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      )}
    </div>
  );
}

function AdminHome({ user }: { user: User }) {
  const groups = getGroups();
  const [view, setView] = useStoredView("sfc.homeGroupView");

  return (
    <>
      <Hero user={user} />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Groups" value={groups.length} href="/groups" />
          <StatCard
            label="Reports this month"
            value={getReportsFiledThisMonth().length}
            href="/reports?period=this-month"
          />
          <StatCard
            label="Planned fellowships"
            value={getUpcomingFellowships().length}
            href="/reports?type=next-fellowship&period=upcoming"
          />
        </div>

        <SectionTitle action={<ViewToggle view={view} onChange={setView} />}>CG Status</SectionTitle>
        {view === "cards" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {groups.map((g) => (
              <GroupMiniCard key={g.id} group={g} />
            ))}
          </div>
        ) : (
          <Card className="divide-y divide-slate-100 overflow-hidden p-0">
            {groups.map((g) => (
              <GroupSummaryRow key={g.id} group={g} />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}

const ACTIONS = [
  { href: "/new/fellowship", emoji: "📝", label: "Fellowship" },
  { href: "/new/follow-up", emoji: "📞", label: "Follow-up" },
  { href: "/new/next-fellowship", emoji: "📅", label: "Plan Next" },
];

function StatusRow({
  href,
  icon,
  label,
  detail,
  badge,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  detail: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 active:bg-slate-50">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[15px] font-semibold">{label}</p>
          {badge && <span className="shrink-0 whitespace-nowrap">{badge}</span>}
        </div>
        <p className="truncate text-xs text-slate-500">{detail}</p>
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
    </Link>
  );
}

function LeaderStatusCard({ groupId }: { groupId: string }) {
  const next = getNextFellowship(groupId);
  const last = getLastFellowship(groupId);

  return (
    <Card className="divide-y divide-slate-100 overflow-hidden p-0">
      {next ? (
        <StatusRow
          href={`/reports/${next.id}`}
          icon={<CalendarIcon width={18} height={18} />}
          label={`Next · ${formatShortDate(next.proposedDate)}`}
          detail={next.location}
          badge={<Badge tone="green">Upcoming</Badge>}
        />
      ) : (
        <StatusRow
          href="/new/next-fellowship"
          icon={<CalendarIcon width={18} height={18} />}
          label="Next fellowship"
          detail="Tap to plan the next fellowship"
          badge={<Badge tone="amber">Not planned</Badge>}
        />
      )}
      {last ? (
        <StatusRow
          href={`/reports/${last.id}`}
          icon={<FileTextIcon width={18} height={18} />}
          label={`Last · ${formatShortDate(last.date)}`}
          detail={`${last.attendees} attended · ${last.firstTimers} first-time`}
        />
      ) : (
        <StatusRow
          href="/new/fellowship"
          icon={<FileTextIcon width={18} height={18} />}
          label="Last fellowship"
          detail="No reports yet"
        />
      )}
    </Card>
  );
}

function LeaderHome({ user, group }: { user: User; group: CommunityGroup }) {
  const spentThisMonth = getReportTypeSummaries(group.id).expenditure.thisMonthAmount;

  return (
    <>
      <Hero user={user} subtitle={group.name} />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Reports this month"
            value={getReportsFiledThisMonth(group.id).length}
            href="/reports?period=this-month"
          />
          <StatCard
            label="Planned fellowships"
            value={getUpcomingFellowships(group.id).length}
            href="/reports?type=next-fellowship&period=upcoming"
          />
          <StatCard
            label="Spent this month"
            value={formatRupees(spentThisMonth)}
            href="/reports?view=expenses&period=this-month"
          />
        </div>

        <SectionTitle>New Report</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-200/70 active:bg-brand-50"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl"
                aria-hidden="true"
              >
                {a.emoji}
              </span>
              <span className="text-sm font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>

        <SectionTitle>CG Status</SectionTitle>
        <LeaderStatusCard groupId={group.id} />
      </div>
    </>
  );
}
