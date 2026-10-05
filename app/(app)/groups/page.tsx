"use client";

import { GroupDetailCard, GroupListItem } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { ViewToggle, useStoredView } from "@/components/ViewToggle";
import { getGroups } from "@/lib/data-access";

export default function GroupsPage() {
  const groups = getGroups();
  const [view, setView] = useStoredView("sfc.groupsView");

  return (
    <RoleGate allow={["admin"]}>
      <PageHeader
        title="Community Groups"
        subtitle={`${groups.length} groups`}
        action={<ViewToggle view={view} onChange={setView} />}
      />
      {view === "cards" ? (
        <div className="grid grid-cols-2 gap-3 p-4">
          {groups.map((g) => (
            <GroupDetailCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <div className="space-y-2 p-4">
          {groups.map((g) => (
            <GroupListItem key={g.id} group={g} />
          ))}
        </div>
      )}
    </RoleGate>
  );
}
