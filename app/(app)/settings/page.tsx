import Link from "next/link";
import { ChevronRightIcon, LogOutIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, InfoRow, SectionTitle } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { getNameDisplay, getRealUser, requireUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";
import { getGroupById } from "@/lib/data-access";
import { ROLE_LABELS } from "@/lib/format";
import { getHiddenSalutationsSetting } from "@/lib/hidden-salutations";
import { isAdminRole, isSuperAdmin } from "@/lib/roles";
import { HiddenSalutationsForm } from "./HiddenSalutationsForm";
import { InstallAppLink } from "./InstallAppLink";
import { SalutationToggle } from "./SalutationToggle";

export default async function SettingsPage() {
  const [user, real] = await Promise.all([requireUser(), getRealUser()]);
  const showAdminBlock = isAdminRole(user.role);
  const showActivity = !!real && isSuperAdmin(real.role) && isAdminRole(user.role);
  const [group, shown, hiddenTitles] = await Promise.all([
    getGroupById(user.groupId),
    getNameDisplay(),
    showActivity ? getHiddenSalutationsSetting() : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="p-4">
        {showAdminBlock && (
          <div className="space-y-2">
            <Link
              href="/people"
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Leaders & logins</span>
                <span className="block text-sm text-slate-500">Add phone numbers and create each login</span>
              </span>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
            </Link>
            <Link
              href="/admins"
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Admins</span>
                <span className="block text-sm text-slate-500">Add admins and reset their logins</span>
              </span>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
            </Link>
            {showActivity && (
              <Link
                href="/activity"
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">Activity log</span>
                  <span className="block text-sm text-slate-500">Feature use and errors across the app</span>
                </span>
                <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
              </Link>
            )}
          </div>
        )}

        <SectionTitle>Signed in as</SectionTitle>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-bold">{shown(user.name)}</p>
            <Badge>{ROLE_LABELS[user.role]}</Badge>
          </div>
          <dl className="mt-2 divide-y divide-slate-100">
            <InfoRow label="Group">{group ? group.name : "All groups"}</InfoRow>
          </dl>
          <SalutationToggle initial={user.showSalutations} />
        </Card>

        {hiddenTitles && <HiddenSalutationsForm initial={hiddenTitles.text} />}

        <div className="mt-3 space-y-2">
          {user.role === "leader" && (
            <Link
              href={`/people/${user.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold">My details</span>
                <span className="block text-sm text-slate-500">Your details and your assistant leaders</span>
              </span>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
            </Link>
          )}
          <Link
            href="/settings/password"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Change password</span>
              <span className="block text-sm text-slate-500">Use your current password to set a new one</span>
            </span>
            <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/updates"
              className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
            >
              <span className="block font-bold">What’s new</span>
              <span className="block text-sm text-slate-500">Launch notes</span>
            </Link>
            <Link
              href="/guide"
              className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
            >
              <span className="block font-bold">How-to guide</span>
              <span className="block text-sm text-slate-500">Screenshots</span>
            </Link>
          </div>
        </div>

        <InstallAppLink />

        <SectionTitle>About</SectionTitle>
        <Card className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{APP_NAME}</p>
          <p>Reports and photos are saved securely and shared only with your group&apos;s leaders and the Admin.</p>
        </Card>

        <form action={signOut} className="mt-4">
          <Button type="submit" variant="secondary" size="lg" block>
            <LogOutIcon width={20} height={20} />
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}
