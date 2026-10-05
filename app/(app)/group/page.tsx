"use client";

import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { NextFellowshipSummary } from "@/components/reports";
import { RoleGate } from "@/components/RoleGate";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { getNextFellowship } from "@/lib/data-access";
import { useCurrentUser } from "@/lib/session";

export default function MyGroupPage() {
  return (
    <RoleGate allow={["leader", "asst-leader"]}>
      <MyGroup />
    </RoleGate>
  );
}

function MyGroup() {
  const { group } = useCurrentUser();
  if (!group) return null;
  const next = getNextFellowship(group.id);

  return (
    <>
      <PageHeader title="My Group" />
      <div className="p-4">
        <GroupProfile group={group} />

        <SectionTitle>Next Fellowship</SectionTitle>
        {next ? (
          <NextFellowshipSummary report={next} />
        ) : (
          <EmptyState title="No fellowship planned yet" />
        )}

        <LinkButton href="/reports" variant="secondary" block className="mt-4">
          View group reports
        </LinkButton>
      </div>
    </>
  );
}
