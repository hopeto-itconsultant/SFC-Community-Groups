import { GroupForm } from "@/components/GroupForm";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { createGroup } from "@/lib/actions/groups";

export default function NewGroupPage() {
  return (
    <RoleGate allow={["admin"]}>
      <PageHeader title="Add Group" backHref="/groups" />
      <GroupForm canEditFrequency submitLabel="ADD GROUP" action={createGroup} />
    </RoleGate>
  );
}
