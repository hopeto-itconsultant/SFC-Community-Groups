import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";
import { SessionProvider } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const group = await getGroupById(user.groupId);

  return (
    <SessionProvider user={user} group={group}>
      <AppShell role={user.role}>{children}</AppShell>
    </SessionProvider>
  );
}
