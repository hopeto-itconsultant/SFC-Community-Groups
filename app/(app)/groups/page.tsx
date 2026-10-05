"use client";

import { GroupListItem } from "@/components/groups";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { getGroups } from "@/lib/data-access";

export default function GroupsPage() {
  const groups = getGroups();
  return (
    <RoleGate allow={["admin"]}>
      <PageHeader title="Community Groups" subtitle={`${groups.length} groups`} />
      <div className="space-y-2 p-4">
        {groups.map((g) => (
          <GroupListItem key={g.id} group={g} />
        ))}
      </div>
    </RoleGate>
  );
}
