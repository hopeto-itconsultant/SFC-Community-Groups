import { CacheCommit } from "@/components/CachedPage";
import { GroupsCached } from "@/components/groups-cache";
import { GroupsScreen } from "@/components/GroupsScreen";
import { RoleGate } from "@/components/RoleGate";
import { getCurrentUser, getNameDisplay, getRealUser } from "@/lib/auth";
import { getClosedGroupCount, getGroupDirectory, getUpcomingBriefs } from "@/lib/data-access";
import { toGroupCardModel } from "@/lib/group-card-model";
import type { GroupsModel } from "@/lib/page-models";
import { scopeKeyForUser } from "@/lib/shell";

export default async function GroupsPage({ searchParams }: PageProps<"/groups">) {
  const { closed } = await searchParams;
  const showClosed = closed === "1";
  return (
    <GroupsCached pageKey={showClosed ? "groups:closed" : "groups:active"}>
      <RoleGate allow={["admin"]}>
        <GroupsContent showClosed={showClosed} />
      </RoleGate>
    </GroupsCached>
  );
}

async function GroupsContent({ showClosed }: { showClosed: boolean }) {
  const [user, real, shown, entries, closedCount, upcoming] = await Promise.all([
    getCurrentUser(),
    getRealUser(),
    getNameDisplay(),
    getGroupDirectory({ includeClosed: showClosed }),
    getClosedGroupCount(),
    getUpcomingBriefs(),
  ]);
  if (!user) return null;
  const model: GroupsModel = {
    countLabel: `${entries.length} groups`,
    showClosed,
    closedCount,
    groups: entries.map((entry) => toGroupCardModel(entry, shown, upcoming.byGroup.get(entry.group.id))),
  };
  const loginAsId = real && real.id !== user.id ? user.id : null;
  return (
    <CacheCommit
      scopeKey={scopeKeyForUser(user, loginAsId)}
      pageKey={showClosed ? "groups:closed" : "groups:active"}
      data={model}
    >
      <GroupsScreen model={model} />
    </CacheCommit>
  );
}
