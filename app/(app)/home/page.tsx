"use client";

import Image from "next/image";
import Link from "next/link";
import type { CommunityGroup, User } from "@/data/types";
import { GroupCard, StatCard } from "@/components/groups";
import { ChevronRightIcon } from "@/components/icons";
import { LastFellowshipSummary, NextFellowshipSummary } from "@/components/reports";
import { Badge, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import {
  getGroups,
  getLastFellowship,
  getNextFellowship,
  getReportsFiledThisMonth,
  getUpcomingFellowships,
} from "@/lib/data-access";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { ROLE_LABELS } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

export default function HomePage() {
  const { user, group } = useCurrentUser();
  if (user.role === "admin") return <AdminHome user={user} />;
  if (!group) return null;
  return <LeaderHome user={user} group={group} />;
}

function Hero({ user, subtitle }: { user: User; subtitle: string }) {
  return (
    <div className="bg-brand-700 px-4 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-100">
        <Image src={LOGO_SRC} alt="" width={28} height={28} className="rounded-lg ring-1 ring-white/30" />
        {APP_NAME}
      </div>
      <p className="mt-5 text-brand-100">Welcome,</p>
      <h1 className="text-2xl font-bold leading-tight">{user.name}</h1>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg font-semibold">{subtitle}</span>
        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
          {ROLE_LABELS[user.role]}
        </span>
      </div>
    </div>
  );
}

function AdminHome({ user }: { user: User }) {
  const groups = getGroups();
  return (
    <>
      <Hero user={user} subtitle="All Community Groups" />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Community Groups" value={groups.length} />
          <StatCard label="Reports This Month" value={getReportsFiledThisMonth().length} />
          <StatCard label="Upcoming Fellowships" value={getUpcomingFellowships().length} />
        </div>

        <SectionTitle>Community Groups</SectionTitle>
        <div className="space-y-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      </div>
    </>
  );
}

const ACTIONS = [
  { href: "/new/fellowship", emoji: "📝", label: "Fellowship Report" },
  { href: "/new/follow-up", emoji: "📞", label: "Follow-up" },
  { href: "/new/next-fellowship", emoji: "📅", label: "Next Fellowship" },
];

function LeaderHome({ user, group }: { user: User; group: CommunityGroup }) {
  const next = getNextFellowship(group.id);
  const last = getLastFellowship(group.id);

  return (
    <>
      <Hero user={user} subtitle={group.name} />
      <div className="-mt-3 px-4">
        <div className="space-y-2">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex min-h-16 items-center gap-4 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-slate-200/70 active:bg-brand-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-2xl" aria-hidden="true">
                {a.emoji}
              </span>
              <span className="flex-1 text-lg font-semibold">{a.label}</span>
              <ChevronRightIcon className="text-slate-400" />
            </Link>
          ))}
        </div>

        <SectionTitle action={next && <Badge tone="green">Upcoming</Badge>}>Next Fellowship</SectionTitle>
        {next ? (
          <NextFellowshipSummary report={next} />
        ) : (
          <EmptyState
            title="No fellowship planned yet"
            action={
              <LinkButton href="/new/next-fellowship" variant="secondary">
                Plan Next Fellowship
              </LinkButton>
            }
          />
        )}

        <SectionTitle>Last Fellowship</SectionTitle>
        {last ? (
          <LastFellowshipSummary report={last} />
        ) : (
          <EmptyState title="No fellowship reports yet" />
        )}
      </div>
    </>
  );
}
