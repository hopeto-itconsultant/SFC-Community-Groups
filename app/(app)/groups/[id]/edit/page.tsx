import { GroupForm } from "@/components/GroupForm";
import { PageHeader } from "@/components/PageHeader";
import { NotAvailable } from "@/components/RoleGate";
import { updateGroup } from "@/lib/actions/groups";
import { requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";
import { canEditGroup, isGroupClosed } from "@/lib/report-rules";
import { isAdminRole } from "@/lib/roles";

export default async function EditGroupPage({ params }: PageProps<"/groups/[id]/edit">) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const group = await getGroupById(id);

  if (!group) return <NotAvailable message="This group could not be found." />;
  if (!canEditGroup(user, group) || isGroupClosed(group)) {
    return <NotAvailable message="Only Admin and this group's leaders can edit it." />;
  }

  const isAdmin = isAdminRole(user.role);
  return (
    <>
      <PageHeader title="Edit Group" subtitle={group.name} backHref={isAdmin ? `/groups/${group.id}` : "/group"} />
      <GroupForm
        initial={group}
        canEditFrequency={isAdmin}
        submitLabel="SAVE CHANGES"
        action={updateGroup.bind(null, group.id)}
      />
    </>
  );
}
