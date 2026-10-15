import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { CurrentUser, Role } from "@/data/types";
import { SHOW_NAME_SALUTATIONS } from "@/lib/config";
import { displayName } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

interface ProfileRow {
  id: string;
  name: string;
  is_admin: boolean;
  active: boolean;
  show_salutations: boolean | null;
  group_leaders: { group_id: string; role: Exclude<Role, "admin">; created_at: string }[];
}

/** The signed-in user, or null when signed out, without a profile, or deactivated. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  // getClaims verifies the access token (refreshing it if needed) instead of trusting the cookie.
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const authUserId = auth?.claims.sub;
  if (authError || !authUserId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, is_admin, active, show_salutations, group_leaders(group_id, role, created_at)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw new Error(`Loading the signed-in profile: ${error.message}`);
  const profile = data as ProfileRow | null;
  if (!profile || !profile.active) return null;

  const showSalutations = profile.show_salutations ?? SHOW_NAME_SALUTATIONS;
  if (profile.is_admin) return { id: profile.id, name: profile.name, role: "admin", showSalutations };

  const [membership] = [...profile.group_leaders].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    id: profile.id,
    name: profile.name,
    role: membership?.role ?? "leader",
    groupId: membership?.group_id,
    showSalutations,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/home");
  return user;
}

/** Formats names for the signed-in person's screens, following their salutation choice. */
export async function getNameDisplay(): Promise<(name: string) => string> {
  const show = (await getCurrentUser())?.showSalutations ?? SHOW_NAME_SALUTATIONS;
  return (name) => displayName(name, show);
}
