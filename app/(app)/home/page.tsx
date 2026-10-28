import Link from "next/link";
import type { ReactNode } from "react";
import type { CommunityGroup, CurrentUser, FellowshipReport, NextFellowship } from "@/data/types";
import { CalendarIcon, ChevronRightIcon, DateCalendarIcon, FileTextIcon } from "@/components/icons";
import { InstallBanner } from "@/components/InstallBanner";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import { requireUser } from "@/lib/auth";
import {
  getGroupById,
  getLastFellowship,
  getNextFellowship,
  getReportTypeSummaries,
  getReportsFiledThisMonthCount,
} from "@/lib/data-access";
import { formatRupees, formatShortDateTimeDay } from "@/lib/format";
import { isAdminRole } from "@/lib/roles";
import { Hero } from "./Hero";

export default async function HomePage() {
  const user = await requireUser();
  if (isAdminRole(user.role)) {
    const { AdminHome } = await import("./AdminHome");
    return <AdminHome user={user} />;
  }
  const group = await getGroupById(user.groupId);
  if (!group) return <NoGroupHome user={user} />;
  return <LeaderHome user={user} group={group} />;
}

function NoGroupHome({ user }: { user: CurrentUser }) {
  return (
    <>
      <Hero user={user} />
      <div className="p-4">
        <InstallBanner className="mb-3" />
        <EmptyState
          title="You're not assigned to a group yet"
          description="Please ask the Admin to add you to your community group."
        />
      </div>
    </>
  );
}

const ACTIONS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/new/fellowship", label: "Fellowship", icon: "📝" },
  { href: "/new/follow-up", label: "Follow-up", icon: "📞" },
  {
    href: "/new/next-fellowship",
    label: "Plan Next",
    icon: <CalendarIcon width={22} height={22} />,
  },
];

function StatusRow({
  href,
  icon,
  label,
  detail,
  badge,
  framedIcon = true,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  detail: ReactNode;
  badge?: ReactNode;
  /** False when `icon` is already a complete chip, such as a dated calendar. */
  framedIcon?: boolean;
}) {
  return (
    <Link href={href} prefetch={false} className="flex items-center gap-3 px-3 py-2.5 active:bg-slate-50">
      <span
        className={
          framedIcon
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"
            : "shrink-0"
        }
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[15px] font-semibold">{label}</p>
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 break-words text-xs text-slate-500">{detail}</p>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
    </Link>
  );
}

function LeaderStatusCard({
  next,
  last,
}: {
  next: NextFellowship | undefined;
  last: FellowshipReport | undefined;
}) {
  return (
    <Card className="divide-y divide-slate-100 overflow-hidden p-0">
      {next ? (
        <StatusRow
          href={`/reports/${next.id}`}
          icon={<DateCalendarIcon date={next.proposedDate} />}
          framedIcon={false}
          label={`Next · ${formatShortDateTimeDay(next.proposedDate, next.time)}`}
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
          label={`Last · ${formatShortDateTimeDay(last.date, last.time)}`}
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

async function LeaderHome({ user, group }: { user: CurrentUser; group: CommunityGroup }) {
  const [summaries, filedThisMonth, next, last] = await Promise.all([
    getReportTypeSummaries(group.id),
    getReportsFiledThisMonthCount(group.id),
    getNextFellowship(group.id),
    getLastFellowship(group.id),
  ]);

  return (
    <>
      <Hero user={user} subtitle={group.name} />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Reports this month"
            value={filedThisMonth}
            href="/reports?period=this-month"
          />
          <StatCard
            label="Planned fellowships"
            value={summaries.nextFellowship.upcomingCount}
            href="/reports?type=next-fellowship&period=upcoming"
          />
          <StatCard
            label="Spent this month"
            value={formatRupees(summaries.expenditure.thisMonthAmount)}
            href="/reports?view=expenses&period=this-month"
          />
        </div>
        <InstallBanner className="mt-3" />

        <SectionTitle>New Report</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              prefetch={false}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-200/70 active:bg-brand-50"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700"
                aria-hidden="true"
              >
                {a.icon}
              </span>
              <span className="text-sm font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>

        <SectionTitle>CG Status</SectionTitle>
        <LeaderStatusCard next={next} last={last} />
      </div>
    </>
  );
}
