import { LEADER_ROLES } from "@/components/form";
import { NextFellowshipForm } from "@/components/NextFellowshipForm";
import { PageHeader } from "@/components/PageHeader";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { createPlan } from "@/lib/actions/reports";
import { requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";

export default function NewNextFellowshipPage() {
  return (
    <RoleGate allow={LEADER_ROLES}>
      <NewPlan />
    </RoleGate>
  );
}

async function NewPlan() {
  const user = await requireUser();
  const group = await getGroupById(user.groupId);
  if (!group) return <NotAvailable message="You're not assigned to a group yet." />;

  return (
    <>
      <PageHeader title="Next Fellowship" subtitle={group.name} backHref="/home" />
      <NextFellowshipForm user={user} group={group} submitLabel="SAVE NEXT FELLOWSHIP" action={createPlan} />
    </>
  );
}
