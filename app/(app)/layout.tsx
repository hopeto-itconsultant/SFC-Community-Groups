import { redirect } from "next/navigation";
import { getRequestUserId } from "@/lib/request-user";
import { AppShell } from "./AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await getRequestUserId())) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
