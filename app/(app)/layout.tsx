import { AppShell } from "@/components/AppShell";
import { getLoginAsLabel, requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";
import { SessionProvider } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [group, loginAsName] = await Promise.all([getGroupById(user.groupId), getLoginAsLabel()]);

  return (
    <SessionProvider user={user} group={group}>
      <AppShell role={user.role} loginAsName={loginAsName}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
