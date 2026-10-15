import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { getGroups, getLeaderRoster } from "@/lib/data-access";
import { LeaderLoginsForm } from "./LeaderLoginsForm";

export default async function PeoplePage() {
  return (
    <RoleGate allow={["admin"]}>
      <PeopleScreen />
    </RoleGate>
  );
}

async function PeopleScreen() {
  const [roster, groups] = await Promise.all([getLeaderRoster(), getGroups()]);
  const people = new Set(roster.flatMap((group) => group.members.map((member) => member.id)));

  return (
    <>
      <PageHeader
        title="Leaders & logins"
        subtitle={`${people.size} ${people.size === 1 ? "person" : "people"}`}
        backHref="/settings"
      />
      <LeaderLoginsForm roster={roster} groups={groups.map((group) => ({ id: group.id, name: group.name }))} />
    </>
  );
}
