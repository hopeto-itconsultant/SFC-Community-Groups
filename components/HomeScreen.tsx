import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { GroupDirectory } from "@/components/GroupDirectory";
import { MeetingLocation, StatCard } from "@/components/groups";
import { CalendarIcon, ChevronRightIcon, DateCalendarIcon, FileTextIcon } from "@/components/icons";
import { InstallBanner } from "@/components/InstallBanner";
import { Badge, Card, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { sortGroupsByNextFellowship, type HomeModel } from "@/lib/page-models";

const ACTIONS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/new/fellowship", label: "Fellowship", icon: "📝" },
  { href: "/new/follow-up", label: "Follow-up", icon: "📞" },
  {
    href: "/new/next-fellowship",
    label: "Plan Next",
    icon: <CalendarIcon width={22} height={22} />,
  },
];

function Hero({
  welcomeName,
  subtitle,
  roleLabel,
}: {
  welcomeName: string;
  subtitle?: string;
  roleLabel?: string;
}) {
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
          Welcome <span className="italic">{welcomeName}</span>
        </h1>
      </div>
      {subtitle && (
        <div className="mt-1 flex items-center gap-2">
          <span className="truncate font-semibold">{subtitle}</span>
          {roleLabel && (
            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">{roleLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

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
          <p className="min-w-0 flex-1 overflow-hidden text-xs text-slate-500">{detail}</p>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
    </Link>
  );
}

export function HomeScreen({ model }: { model: HomeModel }) {
  if (model.kind === "none") {
    return (
      <>
        <Hero welcomeName={model.welcomeName} />
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

  if (model.kind === "admin") {
    return (
      <>
        <Hero welcomeName={model.welcomeName} />
        <div className="-mt-3 px-4">
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Groups" value={model.groupCount} href="/groups" />
            <StatCard
              label="Reports this month"
              value={model.reportsThisMonth}
              href="/reports?period=this-month"
            />
            <StatCard
              label="Planned fellowships"
              value={model.planned}
              href="/reports?type=next-fellowship&period=upcoming"
            />
          </div>
          <InstallBanner className="mt-3" />
          {model.groups.length ? (
            <GroupDirectory
              storageKey="sfc.homeGroupView"
              title="CG Status"
              placement="section"
              variant="mini"
              groups={sortGroupsByNextFellowship(model.groups)}
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

  return (
    <>
      <Hero welcomeName={model.welcomeName} subtitle={model.groupName} roleLabel={model.roleLabel} />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Reports this month" value={model.reportsThisMonth} href="/reports?period=this-month" />
          <StatCard
            label="Planned fellowships"
            value={model.planned}
            href="/reports?type=next-fellowship&period=upcoming"
          />
          <StatCard label="Spent this month" value={model.spentLabel} href="/reports?view=expenses&period=this-month" />
        </div>
        <InstallBanner className="mt-3" />

        <SectionTitle>New Report</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              prefetch={false}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-200/70 active:bg-brand-50"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700"
                aria-hidden="true"
              >
                {action.icon}
              </span>
              <span className="text-sm font-semibold leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>

        <SectionTitle>CG Status</SectionTitle>
        <Card className="divide-y divide-slate-100 overflow-hidden p-0">
          {model.next ? (
            <StatusRow
              href={`/reports/${model.next.id}`}
              icon={<DateCalendarIcon date={model.next.date} />}
              framedIcon={false}
              label={`Next · ${model.next.when}`}
              detail={<MeetingLocation location={model.next.location} />}
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
          {model.last ? (
            <StatusRow
              href={`/reports/${model.last.id}`}
              icon={<FileTextIcon width={18} height={18} />}
              label={`Last · ${model.last.when}`}
              detail={model.last.detail}
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
      </div>
    </>
  );
}
