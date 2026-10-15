import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { CreateAdminForm } from "./CreateAdminForm";

export default function NewAdminPage() {
  return (
    <RoleGate allow={["admin"]}>
      <PageHeader title="Add Admin" backHref="/admins" />
      <CreateAdminForm />
    </RoleGate>
  );
}
