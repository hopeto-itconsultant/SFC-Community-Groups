import { redirect } from "next/navigation";
import { getCurrentUser, getRealUser } from "@/lib/auth";
import { getHiddenSalutations } from "@/lib/hidden-salutations";
import { isSuperAdmin } from "@/lib/roles";
import type { ShellSnapshot } from "@/lib/shell";
import { ShellSyncClient } from "./ShellSyncClient";

/** Loads the signed-in person without blocking the shell, then refreshes the display cookie. */
export async function ShellSync() {
  const [user, real, hidden] = await Promise.all([getCurrentUser(), getRealUser(), getHiddenSalutations()]);
  if (!user) redirect("/login");

  const viewingAs = !!real && real.id !== user.id;
  const shell: ShellSnapshot = {
    id: user.id,
    name: user.name,
    role: user.role,
    groupId: user.groupId,
    showSalutations: user.showSalutations,
    loginAsId: viewingAs ? user.id : null,
    loginAsName: viewingAs ? user.name : null,
    wide: !!real && isSuperAdmin(real.role),
    hidden,
  };

  return <ShellSyncClient shell={shell} />;
}
