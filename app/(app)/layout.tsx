import { AppShell } from "@/components/AppShell";
import { getLoginAsLabel, getRealUser, requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";
import { getHiddenSalutations } from "@/lib/hidden-salutations";
import { isSuperAdmin } from "@/lib/roles";
import { SessionProvider } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [group, loginAsName, real, hiddenSalutations] = await Promise.all([
    getGroupById(user.groupId),
    getLoginAsLabel(),
    getRealUser(),
    getHiddenSalutations(),
  ]);

  return (
    <SessionProvider user={user} group={group} hiddenSalutations={hiddenSalutations}>
      <AppShell
        role={user.role}
        loginAsName={loginAsName}
        wideLayout={!!real && isSuperAdmin(real.role)}
      >
        {children}
      </AppShell>
    </SessionProvider>
  );
}
