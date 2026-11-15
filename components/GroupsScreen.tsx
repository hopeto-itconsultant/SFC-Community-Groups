import { GroupDirectory } from "@/components/GroupDirectory";
import { PlusIcon } from "@/components/icons";
import { LinkButton } from "@/components/ui";
import type { GroupsModel } from "@/lib/page-models";

export function GroupsScreen({ model }: { model: GroupsModel }) {
  return (
    <>
      <GroupDirectory
        storageKey="sfc.groupsView"
        title="Community Groups"
        subtitle={model.countLabel}
        placement="page"
        variant="detail"
        groups={model.groups}
      />
      <div className="space-y-2 px-4 pb-4">
        {model.closedCount > 0 && (
          <LinkButton href={model.showClosed ? "/groups" : "/groups?closed=1"} variant="ghost" block replace>
            {model.showClosed ? "Hide closed groups" : `Show closed groups (${model.closedCount})`}
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
