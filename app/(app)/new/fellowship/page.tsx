import { LEADER_ROLES } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { requireUser } from "@/lib/auth";
import { getFileableFellowshipPlans, getGroupById } from "@/lib/data-access";
import { FellowshipForm } from "./FellowshipForm";

export default function NewFellowshipPage() {
  return (
    <RoleGate allow={LEADER_ROLES}>
      <NewFellowship />
    </RoleGate>
  );
}

async function NewFellowship() {
  const user = await requireUser();
  const group = await getGroupById(user.groupId);
  if (!group) return <NotAvailable message="You're not assigned to a group yet." />;

  const plans = await getFileableFellowshipPlans(group.id);

  return (
    <>
      <PageHeader title="Fellowship Report" note={group.name} backHref="/home" />
      <FellowshipForm user={user} group={group} plans={plans} />
    </>
  );
}
