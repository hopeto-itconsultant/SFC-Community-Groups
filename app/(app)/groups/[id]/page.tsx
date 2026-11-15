import type { Report } from "@/data/types";
import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { NextFellowshipSummary, ReportCard } from "@/components/reports";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SavedBanner";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { getNameDisplay } from "@/lib/auth";
import { getGroupDetail, getLabeledReports, getNextFellowship } from "@/lib/data-access";
import { formatMemberNames } from "@/lib/group-card-model";
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

function RecentList({
  reports,
  empty,
  groupName,
  shown,
}: {
  reports: { report: Report; filerName: string }[];
  empty: string;
  groupName: string;
  shown: (name: string) => string;
}) {
  if (!reports.length) return <EmptyState title={empty} />;
  return (
    <div className="space-y-3">
      {reports.map(({ report, filerName }) => (
        <ReportCard key={report.id} report={report} groupName={groupName} filerName={filerName} shown={shown} />
      ))}
    </div>
  );
}

async function AdminGroupView({ id, saved }: { id: string; saved?: string }) {
  const detail = await getGroupDetail(id);
  if (!detail) return <NotAvailable message="This group could not be found." />;

  const closed = isGroupClosed(detail.group);
  const [shown, next, fellowships, followUps] = await Promise.all([
    getNameDisplay(),
    closed ? Promise.resolve(undefined) : getNextFellowship(detail.group.id),
    getLabeledReports({ groupId: detail.group.id, type: "fellowship", limit: RECENT_LIMIT }),
    getLabeledReports({ groupId: detail.group.id, type: "follow-up", limit: RECENT_LIMIT }),
  ]);
  const banner =
    saved === "added"
      ? `${detail.group.name} added`
      : saved === "updated"
        ? `${detail.group.name} updated`
        : saved === "closed"
          ? `${detail.group.name} closed. Past reports are kept.`
          : undefined;

  return (
    <>
      <PageHeader title={detail.group.name} subtitle={detail.group.category} backHref="/groups" />
      <div className="p-4">
        {banner && <SavedBanner title={banner} />}

        <GroupProfile
          group={detail.group}
          leaders={formatMemberNames(detail.leaders, shown)}
          assistants={formatMemberNames(detail.assistants, shown)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <LinkButton href={`/groups/${detail.group.id}/people`} variant="secondary">
            Leaders &amp; logins
          </LinkButton>
          {!closed && (
            <LinkButton href={`/groups/${detail.group.id}/edit`} variant="secondary">
              Edit Group details
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
        <RecentList
          reports={fellowships.map((item) => ({ report: item.report, filerName: item.filerName }))}
          empty="No fellowship reports yet"
          groupName={detail.group.name}
          shown={shown}
        />

        <SectionTitle>Recent Follow-ups</SectionTitle>
        <RecentList
          reports={followUps.map((item) => ({ report: item.report, filerName: item.filerName }))}
          empty="No follow-up reports yet"
          groupName={detail.group.name}
          shown={shown}
        />

        <LinkButton href={`/reports?group=${detail.group.id}`} variant="secondary" block className="mt-6">
          View all reports for this group
        </LinkButton>

        {!closed && (
          <div className="mt-8 border-t border-slate-200 pt-4">
            <CloseGroupButton groupId={detail.group.id} groupName={detail.group.name} />
          </div>
        )}
      </div>
    </>
  );
}
