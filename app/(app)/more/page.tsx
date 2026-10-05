"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, InfoRow, SectionTitle } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";
import { ROLE_LABELS } from "@/lib/format";
import { useCurrentUser, useSession } from "@/lib/session";

export default function MorePage() {
  const { user, group } = useCurrentUser();
  const { logout } = useSession();
  const router = useRouter();

  function switchUser() {
    router.replace("/login");
    logout();
  }

  return (
    <>
      <PageHeader title="More" />
      <div className="p-4">
        <SectionTitle>Signed in as</SectionTitle>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-bold">{user.name}</p>
            <Badge>{ROLE_LABELS[user.role]}</Badge>
          </div>
          <dl className="mt-2 divide-y divide-slate-100">
            <InfoRow label="Group">{group ? group.name : "All groups"}</InfoRow>
          </dl>
        </Card>

        <div className="mt-4">
          <Button variant="secondary" size="lg" block onClick={switchUser}>
            <LogOutIcon width={20} height={20} />
            Switch demo user
          </Button>
        </div>

        <SectionTitle>About</SectionTitle>
        <Card className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{APP_NAME}</p>
          <p>
            This is a UI prototype. Reports shown are sample data, and anything you submit is
            shown back to you but not saved.
          </p>
          <p>Photos you select stay on your phone and are not uploaded.</p>
        </Card>
      </div>
    </>
  );
}
