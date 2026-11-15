import { CacheCommit } from "@/components/CachedPage";
import { MyGroupCached } from "@/components/my-group-cache";
import { MyGroupScreen } from "@/components/MyGroupScreen";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { getNameDisplay, getRealUser, requireUser } from "@/lib/auth";
import { getAssistantLeaders, getGroupDetail, getNextFellowship } from "@/lib/data-access";
import { formatMemberNames } from "@/lib/group-card-model";
import type { MyGroupModel } from "@/lib/page-models";
import { scopeKeyForUser } from "@/lib/shell";

export default async function MyGroupPage({ searchParams }: PageProps<"/group">) {
  const { saved } = await searchParams;
  return (
    <MyGroupCached>
      <RoleGate allow={["leader", "asst-leader"]}>
        <MyGroup saved={saved === "updated"} />
      </RoleGate>
    </MyGroupCached>
  );
}

async function MyGroup({ saved }: { saved: boolean }) {
  const [user, real] = await Promise.all([requireUser(), getRealUser()]);
  if (!user.groupId) return <NotAvailable message="You're not assigned to a group yet." />;
  const isLeader = user.role === "leader";
  const [detail, shown, next, assistants] = await Promise.all([
    getGroupDetail(user.groupId),
    getNameDisplay(),
    getNextFellowship(user.groupId),
    isLeader ? getAssistantLeaders([user.groupId], user.id) : Promise.resolve([]),
  ]);
  if (!detail) return <NotAvailable message="You're not assigned to a group yet." />;

  const model: MyGroupModel = {
    group: {
      id: detail.group.id,
      name: detail.group.name,
      category: detail.group.category,
      frequency: detail.group.frequency,
      photo: detail.group.photo,
      status: detail.group.status,
      closedAt: detail.group.closedAt,
    },
    leaders: formatMemberNames(detail.leaders, shown),
    assistants: formatMemberNames(detail.assistants, shown),
    hideAssistants: isLeader,
    savedTitle: saved ? `${detail.group.name} updated` : undefined,
    next: next
      ? {
          id: next.id,
          date: next.proposedDate,
          time: next.time,
          location: next.location,
          activity: next.activity,
        }
      : null,
  };
  const loginAsId = real && real.id !== user.id ? user.id : null;

  return (
    <CacheCommit scopeKey={scopeKeyForUser(user, loginAsId)} pageKey="my-group" data={{ ...model, savedTitle: undefined }}>
      <MyGroupScreen model={model} assistants={isLeader ? assistants : undefined} />
    </CacheCommit>
  );
}
