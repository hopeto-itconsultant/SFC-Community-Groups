import { GroupDetailCard, GroupListItem } from "@/components/groups";
import { PlusIcon } from "@/components/icons";
import { RoleGate } from "@/components/RoleGate";
import { LinkButton } from "@/components/ui";
import { ViewSwitch } from "@/components/ViewToggle";
import { getClosedGroupCount, getGroups } from "@/lib/data-access";

export default async function GroupsPage({ searchParams }: PageProps<"/groups">) {
  const { closed } = await searchParams;
  return (
    <RoleGate allow={["admin"]}>
      <GroupsList showClosed={closed === "1"} />
    </RoleGate>
  );
}

async function GroupsList({ showClosed }: { showClosed: boolean }) {
  const [groups, closedCount] = await Promise.all([
    getGroups({ includeClosed: showClosed }),
    getClosedGroupCount(),
  ]);

  return (
    <>
      <ViewSwitch
        storageKey="sfc.groupsView"
        title="Community Groups"
        subtitle={`${groups.length} groups`}
        placement="page"
        cards={
          <div className="grid grid-cols-2 gap-3 p-4 @md:grid-cols-3 @lg:grid-cols-4">
            {groups.map((g) => (
              <GroupDetailCard key={g.id} group={g} />
            ))}
          </div>
        }
        list={
          <div className="space-y-2 p-4">
            {groups.map((g) => (
              <GroupListItem key={g.id} group={g} />
            ))}
          </div>
        }
      />
      <div className="space-y-2 px-4 pb-4">
        {closedCount > 0 && (
          <LinkButton href={showClosed ? "/groups" : "/groups?closed=1"} variant="ghost" block replace>
            {showClosed ? "Hide closed groups" : `Show closed groups (${closedCount})`}
          </LinkButton>
        )}
        <LinkButton href="/groups/new" variant="secondary" block>
          <PlusIcon width={18} height={18} />
          Add group
        </LinkButton>
      </div>
    </>
  );
}
