import type { ReactNode } from "react";
import type { Role } from "@/data/types";
import { requireUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { PageHeader } from "./PageHeader";
import { EmptyState, LinkButton } from "./ui";

function roleAllowed(role: Role, allow: Role[]): boolean {
  if (allow.includes(role)) return true;
  // Screens that allow "admin" also allow superadmin.
  return isAdminRole(role) && allow.includes("admin");
}

/** Renders `children` (and so loads their data) only for the allowed roles. */
export async function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const user = await requireUser();
  if (roleAllowed(user.role, allow)) return <>{children}</>;
  return <NotAvailable />;
}

export function NotAvailable({ message }: { message?: string }) {
  return (
    <>
      <PageHeader title="Not available" backHref="/home" />
      <div className="p-4">
        <EmptyState
          title="This page isn't available"
          description={message ?? "Your role doesn't have access to this page."}
          action={
            <LinkButton href="/home" variant="secondary">
              Go to Home
            </LinkButton>
          }
        />
      </div>
    </>
  );
}
