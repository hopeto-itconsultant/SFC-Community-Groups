import { LogOutIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, InfoRow, SectionTitle } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";
import { getGroupById } from "@/lib/data-access";
import { ROLE_LABELS } from "@/lib/format";

export default async function MorePage() {
  const user = await requireUser();
  const group = await getGroupById(user.groupId);

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

        <form action={signOut} className="mt-4">
          <Button type="submit" variant="secondary" size="lg" block>
            <LogOutIcon width={20} height={20} />
            Sign out
          </Button>
        </form>

        <SectionTitle>About</SectionTitle>
        <Card className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{APP_NAME}</p>
          <p>Reports and photos are saved securely and shared only with your group&apos;s leaders and the Admin.</p>
        </Card>
      </div>
    </>
  );
}
