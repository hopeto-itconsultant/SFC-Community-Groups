import type { Report } from "@/data/types";
import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { NextFellowshipSummary, ReportCard } from "@/components/reports";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SavedBanner";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { getGroupById, getNextFellowship, getReports } from "@/lib/data-access";
import { isGroupClosed } from "@/lib/report-rules";
import { CloseGroupButton } from "./CloseGroupButton";

const RECENT_LIMIT = 3;

export default async function AdminGroupPage({ params, searchParams }: PageProps<"/groups/[id]">) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  return (
    <RoleGate allow={["admin"]}>
      <AdminGroupView id={id} saved={typeof saved === "string" ? saved : undefined} />
    </RoleGate>
  );
}

function RecentList({ reports, empty }: { reports: Report[]; empty: string }) {
  if (!reports.length) return <EmptyState title={empty} />;
  return (
    <div className="space-y-3">
      {reports.slice(0, RECENT_LIMIT).map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}

async function AdminGroupView({ id, saved }: { id: string; saved?: string }) {
  const group = await getGroupById(id);
  if (!group) return <NotAvailable message="This group could not be found." />;

  const closed = isGroupClosed(group);
  const [next, fellowships, followUps] = await Promise.all([
    closed ? undefined : getNextFellowship(group.id),
    getReports({ groupId: group.id, type: "fellowship" }),
    getReports({ groupId: group.id, type: "follow-up" }),
  ]);
  const banner =
    saved === "added"
      ? `${group.name} added`
      : saved === "updated"
        ? `${group.name} updated`
        : saved === "closed"
          ? `${group.name} closed. Past reports are kept.`
          : undefined;

  return (
    <>
      <PageHeader title={group.name} subtitle={group.category} backHref="/groups" />
      <div className="p-4">
        {banner && <SavedBanner title={banner} />}

        <GroupProfile group={group} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <LinkButton href={`/groups/${group.id}/people`} variant="secondary">
            Leaders &amp; logins
          </LinkButton>
          {!closed && (
            <LinkButton href={`/groups/${group.id}/edit`} variant="secondary">
              Edit profile
            </LinkButton>
          )}
        </div>

        {!closed && (
          <>
            <SectionTitle>Next Fellowship</SectionTitle>
            {next ? <NextFellowshipSummary report={next} /> : <EmptyState title="Not planned yet" />}
          </>
        )}

        <SectionTitle>Recent Fellowship Reports</SectionTitle>
        <RecentList reports={fellowships} empty="No fellowship reports yet" />

        <SectionTitle>Recent Follow-ups</SectionTitle>
        <RecentList reports={followUps} empty="No follow-up reports yet" />

        <LinkButton href={`/reports?group=${group.id}`} variant="secondary" block className="mt-6">
          View all reports for this group
        </LinkButton>

        {!closed && (
          <div className="mt-8 border-t border-slate-200 pt-4">
            <CloseGroupButton groupId={group.id} groupName={group.name} />
          </div>
        )}
      </div>
    </>
  );
}
