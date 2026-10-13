import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role, User } from "@/data/types";
import { createClient } from "@/lib/supabase/server";

interface ProfileRow {
  id: string;
  name: string;
  is_admin: boolean;
  active: boolean;
  group_leaders: { group_id: string; role: Exclude<Role, "admin">; created_at: string }[];
}

/** The signed-in user, or null when signed out, without a profile, or deactivated. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  // getClaims verifies the access token (refreshing it if needed) instead of trusting the cookie.
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const authUserId = auth?.claims.sub;
  if (authError || !authUserId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, is_admin, active, group_leaders(group_id, role, created_at)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw new Error(`Loading the signed-in profile: ${error.message}`);
  const profile = data as ProfileRow | null;
  if (!profile || !profile.active) return null;

  if (profile.is_admin) return { id: profile.id, name: profile.name, role: "admin" };

  const [membership] = [...profile.group_leaders].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    id: profile.id,
    name: profile.name,
    role: membership?.role ?? "leader",
    groupId: membership?.group_id,
  };
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/home");
  return user;
}
