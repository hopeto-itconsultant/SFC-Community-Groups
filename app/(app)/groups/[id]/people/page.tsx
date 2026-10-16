import { PageHeader } from "@/components/PageHeader";
import { NotAvailable, RoleGate } from "@/components/RoleGate";
import { EmptyState, SectionTitle } from "@/components/ui";
import { getRealUser } from "@/lib/auth";
import { getGroupById, getGroupMembers } from "@/lib/data-access";
import { isSuperAdmin } from "@/lib/roles";
import { AddMemberForm } from "./AddMemberForm";
import { MemberCard } from "./MemberCard";

export default async function GroupPeoplePage({ params }: PageProps<"/groups/[id]/people">) {
  const { id } = await params;
  return (
    <RoleGate allow={["admin"]}>
      <GroupPeople id={id} />
    </RoleGate>
  );
}

async function GroupPeople({ id }: { id: string }) {
  const group = await getGroupById(id);
  if (!group) return <NotAvailable message="This group could not be found." />;
  const [members, real] = await Promise.all([getGroupMembers(group.id), getRealUser()]);
  const canLoginAs = !!real && isSuperAdmin(real.role);

  return (
    <>
      <PageHeader title="Leaders & logins" subtitle={group.name} backHref={`/groups/${group.id}`} />
      <div className="p-4">
        <p className="px-1 text-sm text-slate-500">
          Leaders and assistant leaders sign in with their mobile number and a password you set here.
        </p>

        <SectionTitle>People</SectionTitle>
        {members.length ? (
          <div className="space-y-2">
            {members.map((m) => (
              <MemberCard key={m.id} groupId={group.id} member={m} canLoginAs={canLoginAs} />
            ))}
          </div>
        ) : (
          <EmptyState title="No leaders yet" description="Add the group's leader below." />
        )}

        <SectionTitle>Add a person</SectionTitle>
        <AddMemberForm groupId={group.id} />
      </div>
    </>
  );
}
