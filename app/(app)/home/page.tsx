import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CommunityGroup, CurrentUser } from "@/data/types";
import { GroupMiniCard, GroupSummaryRow, StatCard } from "@/components/groups";
import { CalendarIcon, ChevronRightIcon, FileTextIcon } from "@/components/icons";
import { InstallBanner } from "@/components/InstallBanner";
import { Badge, Card, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { ViewSwitch } from "@/components/ViewToggle";
import { requireUser } from "@/lib/auth";
import {
  getGroupById,
  getGroups,
  getLastFellowship,
  getNextFellowship,
  getReportTypeSummaries,
  getReportsFiledThisMonth,
  getUpcomingFellowships,
} from "@/lib/data-access";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { ROLE_LABELS, displayName, formatRupees, formatShortDateTimeDay } from "@/lib/format";
import { isAdminRole } from "@/lib/roles";

export default async function HomePage() {
  const user = await requireUser();
  if (isAdminRole(user.role)) return <AdminHome user={user} />;
  const group = await getGroupById(user.groupId);
  if (!group) return <NoGroupHome user={user} />;
  return <LeaderHome user={user} group={group} />;
}

function Hero({ user, subtitle }: { user: CurrentUser; subtitle?: string }) {
  return (
    <div className="bg-brand-700 px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-100">
          <Image
            src={LOGO_SRC}
            alt=""
            width={24}
            height={24}
            unoptimized
            className="shrink-0 rounded-md ring-1 ring-white/30"
          />
          <span className="truncate">{APP_NAME}</span>
        </div>
        <h1 className="shrink-0 text-xs text-brand-100">
          Welcome <span className="italic">{displayName(user.name, user.showSalutations)}</span>
        </h1>
      </div>
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

async function AdminHome({ user }: { user: CurrentUser }) {
  const [groups, filedThisMonth, upcoming] = await Promise.all([
    getGroups(),
    getReportsFiledThisMonth(),
    getUpcomingFellowships(),
  ]);

  return (
    <>
      <Hero user={user} />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Groups" value={groups.length} href="/groups" />
          <StatCard
            label="Reports this month"
            value={filedThisMonth.length}
            href="/reports?period=this-month"
          />
          <StatCard
            label="Planned fellowships"
            value={upcoming.length}
            href="/reports?type=next-fellowship&period=upcoming"
          />
        </div>
        <InstallBanner className="mt-3" />

        {groups.length ? (
          <ViewSwitch
            storageKey="sfc.homeGroupView"
            title="CG Status"
            placement="section"
            sectionClassName="mb-1.5 mt-3"
            cards={
              <div className="grid grid-cols-2 gap-2">
                {groups.map((g) => (
                  <GroupMiniCard key={g.id} group={g} />
                ))}
              </div>
            }
            list={
              <Card className="divide-y divide-slate-100 overflow-hidden p-0">
                {groups.map((g) => (
                  <GroupSummaryRow key={g.id} group={g} />
                ))}
              </Card>
            }
          />
        ) : (
          <>
            <SectionTitle>CG Status</SectionTitle>
            <EmptyState
              title="No groups yet"
              description="Add the first community group to get started."
              action={<LinkButton href="/groups/new">Add group</LinkButton>}
            />
          </>
        )}
      </div>
    </>
  );
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
    <Link href={href} prefetch={false} className="flex items-center gap-3 px-3 py-2.5 active:bg-slate-50">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"
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

async function LeaderStatusCard({ groupId }: { groupId: string }) {
  const [next, last] = await Promise.all([getNextFellowship(groupId), getLastFellowship(groupId)]);

  return (
    <Card className="divide-y divide-slate-100 overflow-hidden p-0">
      {next ? (
        <StatusRow
          href={`/reports/${next.id}`}
          icon={<CalendarIcon width={18} height={18} />}
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
  const [summaries, filedThisMonth, upcoming] = await Promise.all([
    getReportTypeSummaries(group.id),
    getReportsFiledThisMonth(group.id),
    getUpcomingFellowships(group.id),
  ]);

  return (
    <>
      <Hero user={user} subtitle={group.name} />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Reports this month"
            value={filedThisMonth.length}
            href="/reports?period=this-month"
          />
          <StatCard
            label="Planned fellowships"
            value={upcoming.length}
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
