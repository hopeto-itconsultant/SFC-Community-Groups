import { LEADER_ROLES } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";
import { FollowUpForm } from "./FollowUpForm";

export default function NewFollowUpPage() {
  return (
    <RoleGate allow={LEADER_ROLES}>
      <NewFollowUp />
    </RoleGate>
  );
}

async function NewFollowUp() {
  const user = await requireUser();
  const group = await getGroupById(user.groupId);
  if (!group) return <NotAvailable message="You're not assigned to a group yet." />;

  return (
    <>
      <PageHeader title="Follow-up Report" subtitle={group.name} backHref="/home" />
      <FollowUpForm user={user} group={group} />
    </>
  );
}
