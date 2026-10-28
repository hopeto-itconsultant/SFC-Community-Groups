import type { CurrentUser } from "@/data/types";
import { GroupMiniCard, GroupSummaryRow } from "@/components/groups";
import { InstallBanner } from "@/components/InstallBanner";
import { StatCard } from "@/components/StatCard";
import { Card, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { ViewSwitch } from "@/components/ViewToggle";
import { getGroups, getReportTypeSummaries, getReportsFiledThisMonthCount } from "@/lib/data-access";
import { Hero } from "./Hero";

export async function AdminHome({ user }: { user: CurrentUser }) {
  const [groups, filedThisMonth, summaries] = await Promise.all([
    getGroups(),
    getReportsFiledThisMonthCount(),
    getReportTypeSummaries(),
  ]);

  return (
    <>
      <Hero user={user} />
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Groups" value={groups.length} href="/groups" />
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
        </div>
        <InstallBanner className="mt-3" />

        {groups.length ? (
          <ViewSwitch
            storageKey="sfc.homeGroupView"
            title="CG Status"
            placement="section"
            sectionClassName="mb-1.5 mt-3"
            cards={
              <div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @lg:grid-cols-4">
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
