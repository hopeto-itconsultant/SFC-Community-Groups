"use client";

import type { ReactNode } from "react";
import type { Role } from "@/data/types";
import { useCurrentUser } from "@/lib/session";
import { PageHeader } from "./PageHeader";
import { EmptyState, LinkButton } from "./ui";

export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useCurrentUser();
  if (allow.includes(user.role)) return <>{children}</>;
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
