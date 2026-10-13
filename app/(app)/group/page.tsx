import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { NextFellowshipSummary } from "@/components/reports";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SavedBanner";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getGroupById, getNextFellowship } from "@/lib/data-access";

export default async function MyGroupPage({ searchParams }: PageProps<"/group">) {
  const { saved } = await searchParams;
  return (
    <RoleGate allow={["leader", "asst-leader"]}>
      <MyGroup saved={saved === "updated"} />
    </RoleGate>
  );
}

async function MyGroup({ saved }: { saved: boolean }) {
  const user = await requireUser();
  const group = await getGroupById(user.groupId);
  if (!group) return <NotAvailable message="You're not assigned to a group yet." />;
  const next = await getNextFellowship(group.id);

  return (
    <>
      <PageHeader title="My Group" />
      <div className="p-4">
        {saved && <SavedBanner title={`${group.name} updated`} />}
        <GroupProfile group={group} />
        <LinkButton href={`/groups/${group.id}/edit`} variant="secondary" block className="mt-3">
          Edit group profile
        </LinkButton>

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
