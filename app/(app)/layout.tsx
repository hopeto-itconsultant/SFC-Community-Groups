import { AppShell } from "@/components/AppShell";
import { getLoginAsLabel, requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";
import { getHiddenSalutations } from "@/lib/hidden-salutations";
import { SessionProvider } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [group, loginAsName, hiddenSalutations] = await Promise.all([
    getGroupById(user.groupId),
    getLoginAsLabel(),
    getHiddenSalutations(),
  ]);

  return (
    <SessionProvider user={user} group={group} hiddenSalutations={hiddenSalutations}>
      <AppShell role={user.role} loginAsName={loginAsName}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
