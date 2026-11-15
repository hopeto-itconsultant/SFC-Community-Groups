import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ShellSync } from "@/components/ShellSync";
import { SessionProvider } from "@/lib/session";
import { SHELL_COOKIE, parseShellSnapshot } from "@/lib/shell";
import { cookies } from "next/headers";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const shell = parseShellSnapshot(cookieStore.get(SHELL_COOKIE)?.value);

  return (
    <SessionProvider initial={shell}>
      <AppShell>{children}</AppShell>
      <Suspense fallback={null}>
        <ShellSync />
      </Suspense>
    </SessionProvider>
  );
}
