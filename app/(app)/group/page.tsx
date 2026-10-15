import { GroupProfile } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { NextFellowshipSummary } from "@/components/reports";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SavedBanner";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { AssistantLeaders } from "@/app/(app)/people/[id]/AssistantLeaders";
import { requireUser } from "@/lib/auth";
import { getAssistantLeaders, getGroupById, getNextFellowship } from "@/lib/data-access";

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
  const isLeader = user.role === "leader";
  const [next, assistants] = await Promise.all([
    getNextFellowship(group.id),
    isLeader ? getAssistantLeaders([group.id], user.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader title="My Group" />
      <div className="p-4">
        {saved && <SavedBanner title={`${group.name} updated`} />}
        <GroupProfile group={group} hideAssistants={isLeader} />
        <LinkButton href={`/groups/${group.id}/edit`} variant="secondary" block className="mt-3">
          Edit group profile
        </LinkButton>

        {isLeader && <AssistantLeaders assistants={assistants} showGroups={false} />}

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
