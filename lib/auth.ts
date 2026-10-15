import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { CurrentUser, Role } from "@/data/types";
import { SHOW_NAME_SALUTATIONS, SUPERADMIN } from "@/lib/config";
import { isUuid } from "@/lib/data-access";
import { displayName } from "@/lib/format";
import { clearLoginAsProfileId, getLoginAsProfileId } from "@/lib/login-as";
import { createClient } from "@/lib/supabase/server";

async function clearStaleLoginAs(): Promise<void> {
  try {
    await clearLoginAsProfileId();
  } catch {
    // Server Components cannot always set cookies; the next action will clear it.
  }
}

interface ProfileRow {
  id: string;
  name: string;
  is_admin: boolean;
  active: boolean;
  show_salutations: boolean | null;
  auth_user_id: string | null;
  group_leaders: { group_id: string; role: Exclude<Role, "admin">; created_at: string }[];
}

function toCurrentUser(profile: ProfileRow): CurrentUser {
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
}

async function loadProfileByAuthUserId(authUserId: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, is_admin, active, show_salutations, auth_user_id, group_leaders(group_id, role, created_at)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw new Error(`Loading the signed-in profile: ${error.message}`);
  const profile = data as ProfileRow | null;
  if (!profile || !profile.active) return null;
  return profile;
}

async function loadLoginAsTarget(profileId: string): Promise<ProfileRow | null> {
  if (!isUuid(profileId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, is_admin, active, show_salutations, auth_user_id, group_leaders(group_id, role, created_at)")
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw new Error(`Loading the login-as profile: ${error.message}`);
  const profile = data as ProfileRow | null;
  if (!profile || !profile.active || profile.is_admin || !profile.auth_user_id) return null;
  if (!profile.group_leaders.length) return null;
  return profile;
}

/**
 * The profile tied to the Auth session, ignoring any Admin "login as" overlay.
 * Used to start/stop login-as and to confirm the caller is really an Admin.
 */
export const getRealUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const authUserId = auth?.claims.sub;
  if (authError || !authUserId) return null;

  const profile = await loadProfileByAuthUserId(authUserId);
  if (!profile) return null;
  return toCurrentUser(profile);
});

/** The signed-in user (with Admin login-as overlay), or null when signed out / inactive. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const real = await getRealUser();
  if (!real) return null;
  if (real.role !== "admin") return real;
  if (!SUPERADMIN) {
    if (await getLoginAsProfileId()) await clearStaleLoginAs();
    return real;
  }

  const targetId = await getLoginAsProfileId();
  if (!targetId) return real;

  const target = await loadLoginAsTarget(targetId);
  if (!target) {
    await clearStaleLoginAs();
    return real;
  }

  return toCurrentUser(target);
});

/** When an Admin is viewing as someone else, the overlay target's display name. */
export const getLoginAsLabel = cache(async (): Promise<string | null> => {
  if (!SUPERADMIN) return null;
  const real = await getRealUser();
  if (!real || real.role !== "admin") return null;
  const targetId = await getLoginAsProfileId();
  if (!targetId) return null;
  const target = await loadLoginAsTarget(targetId);
  return target?.name ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires the Auth session to be an Admin (login-as overlay does not count). */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getRealUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/home");
  return user;
}

/** Formats names for the signed-in person's screens, following their salutation choice. */
export async function getNameDisplay(): Promise<(name: string) => string> {
  const show = (await getCurrentUser())?.showSalutations ?? SHOW_NAME_SALUTATIONS;
  return (name) => displayName(name, show);
}
