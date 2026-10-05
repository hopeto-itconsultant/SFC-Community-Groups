"use client";

import { useParams } from "next/navigation";
import type { Report } from "@/data/types";
import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { NextFellowshipSummary, ReportCard } from "@/components/reports";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { getGroupById, getNextFellowship, getReports } from "@/lib/data-access";

const RECENT_LIMIT = 3;

export default function AdminGroupPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminGroupView />
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

function AdminGroupView() {
  const { id } = useParams<{ id: string }>();
  const group = getGroupById(id);
  if (!group) return <NotAvailable message="This group could not be found." />;

  const next = getNextFellowship(group.id);
  const fellowships = getReports({ groupId: group.id, type: "fellowship" });
  const followUps = getReports({ groupId: group.id, type: "follow-up" });

  return (
    <>
      <PageHeader title={group.name} subtitle={group.category} backHref="/groups" />
      <div className="p-4">
        <GroupProfile group={group} />

        <SectionTitle>Next Fellowship</SectionTitle>
        {next ? <NextFellowshipSummary report={next} /> : <EmptyState title="Not planned yet" />}

        <SectionTitle>Recent Fellowship Reports</SectionTitle>
        <RecentList reports={fellowships} empty="No fellowship reports yet" />

        <SectionTitle>Recent Follow-ups</SectionTitle>
        <RecentList reports={followUps} empty="No follow-up reports yet" />

        <LinkButton href={`/reports?group=${group.id}`} variant="secondary" block className="mt-6">
          View all reports for this group
        </LinkButton>
      </div>
    </>
  );
}
