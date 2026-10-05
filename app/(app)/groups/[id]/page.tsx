"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { CommunityGroup, Report } from "@/data/types";
import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { NextFellowshipSummary, ReportCard } from "@/components/reports";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SubmittedView";
import { Button, ConfirmCard, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { getGroupById, getNextFellowship, getReports, isGroupClosed } from "@/lib/data-access";
import { todayISO } from "@/lib/format";

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
  const stored = getGroupById(id);
  const [closedNow, setClosedNow] = useState(false);
  const [confirming, setConfirming] = useState(false);
  if (!stored) return <NotAvailable message="This group could not be found." />;

  const group: CommunityGroup = closedNow
    ? { ...stored, status: "closed", closedAt: todayISO() }
    : stored;
  const closed = isGroupClosed(group);
  const next = closed ? undefined : getNextFellowship(group.id);
  const fellowships = getReports({ groupId: group.id, type: "fellowship" });
  const followUps = getReports({ groupId: group.id, type: "follow-up" });

  return (
    <>
      <PageHeader title={group.name} subtitle={group.category} backHref="/groups" />
      <div className="p-4">
        {closedNow && <SavedBanner title={`${group.name} closed. Past reports are kept.`} />}

        <GroupProfile group={group} />
        {!closed && (
          <LinkButton href={`/groups/${group.id}/edit`} variant="secondary" block className="mt-3">
            Edit group profile
          </LinkButton>
        )}

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
            {confirming ? (
              <ConfirmCard
                title={`Close ${group.name}?`}
                description="The group will be hidden from the dashboard and lists. Its past reports are kept and can still be viewed."
                confirmLabel="Close group"
                onBack={() => setConfirming(false)}
                onConfirm={() => {
                  setConfirming(false);
                  setClosedNow(true);
                  window.scrollTo(0, 0);
                }}
              />
            ) : (
              <Button variant="danger" block onClick={() => setConfirming(true)}>
                Close group
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
