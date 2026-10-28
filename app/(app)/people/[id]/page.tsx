import { PageHeader } from "@/components/PageHeader";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { getNameDisplay, requireUser } from "@/lib/auth";
import { getAssistantLeaders, getLeaderProfile } from "@/lib/data-access";
import { ROLE_LABELS } from "@/lib/format";
import { isAdminRole } from "@/lib/roles";
import { AssistantLeaders } from "./AssistantLeaders";
import { LeaderDetailsForm } from "./LeaderDetailsForm";

export default async function LeaderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RoleGate allow={["admin", "leader"]}>
      <LeaderDetails id={id} />
    </RoleGate>
  );
}

async function LeaderDetails({ id }: { id: string }) {
  const user = await requireUser();
  const asAdmin = isAdminRole(user.role);
  if (!asAdmin && user.id !== id) {
    return <NotAvailable message="This person could not be found." />;
  }

  const leader = await getLeaderProfile(id);
  if (!leader) return <NotAvailable message="This person could not be found." />;

  const scopedGroups = asAdmin ? leader.groups : leader.groups.filter((group) => group.role === "leader");
  const assistants = scopedGroups.length
    ? await getAssistantLeaders(
        scopedGroups.map((group) => group.id),
        leader.id,
      )
    : [];
  const groups = leader.groups
    .map((group) => `${group.name} · ${ROLE_LABELS[group.role]}${group.status === "closed" ? " · Closed" : ""}`)
    .join(", ");
  const shown = await getNameDisplay();

  return (
    <>
      <PageHeader
        title={shown(leader.name)}
        subtitle={groups || "No group"}
        backHref={asAdmin ? "/people" : "/settings"}
      />
      <div className="p-4">
        {!leader.active && <p className="mb-3 text-sm font-medium text-slate-500">This login is deactivated.</p>}
        <LeaderDetailsForm leader={leader} />
        {scopedGroups.length > 0 && <AssistantLeaders assistants={assistants} />}
      </div>
    </>
  );
}
