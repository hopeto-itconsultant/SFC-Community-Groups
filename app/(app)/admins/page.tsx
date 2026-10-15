import { PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAdmins } from "@/lib/data-access";
import { AdminCard } from "./AdminCard";

export default async function AdminsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminsScreen />
    </RoleGate>
  );
}

async function AdminsScreen() {
  const [user, admins] = await Promise.all([requireUser(), getAdmins()]);

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle={`${admins.length} ${admins.length === 1 ? "admin" : "admins"}`}
        backHref="/settings"
      />
      <div className="p-4">
        <p className="px-1 text-sm text-slate-500">
          Admins sign in with a username or a mobile number, and a password you set here. They can see every group.
        </p>

        <SectionTitle>People</SectionTitle>
        {admins.length ? (
          <div className="space-y-2">
            {admins.map((admin) => (
              <AdminCard key={admin.id} admin={admin} isYou={admin.id === user.id} />
            ))}
          </div>
        ) : (
          <EmptyState title="No admins yet" description="Add an admin below." />
        )}

        <div className="mt-6">
          <LinkButton href="/admins/new" variant="secondary" block>
            <PlusIcon width={18} height={18} />
            Add admin
          </LinkButton>
        </div>
      </div>
    </>
  );
}
