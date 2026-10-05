"use client";

import { useState } from "react";
import { GroupDetailCard, GroupListItem } from "@/components/groups";
import { PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { Button, LinkButton } from "@/components/ui";
import { ViewToggle, useStoredView } from "@/components/ViewToggle";
import { getClosedGroupCount, getGroups } from "@/lib/data-access";

export default function GroupsPage() {
  const [showClosed, setShowClosed] = useState(false);
  const groups = getGroups({ includeClosed: showClosed });
  const closedCount = getClosedGroupCount();
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
      <div className="space-y-2 px-4 pb-4">
        {closedCount > 0 && (
          <Button variant="ghost" block onClick={() => setShowClosed((v) => !v)}>
            {showClosed ? "Hide closed groups" : `Show closed groups (${closedCount})`}
          </Button>
        )}
        <LinkButton href="/groups/new" variant="secondary" block>
          <PlusIcon width={18} height={18} />
          Add group
        </LinkButton>
      </div>
    </RoleGate>
  );
}
