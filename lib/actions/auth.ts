"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRealUser, requireUser } from "@/lib/auth";
import { SUPERADMIN } from "@/lib/config";
import { isUuid } from "@/lib/data-access";
import {
  loginEmailForProfile,
  looksLikeMobile,
  normalizeMobile,
  normalizeUsername,
} from "@/lib/login-id";
import { clearLoginAsProfileId, getLoginAsProfileId, setLoginAsProfileId } from "@/lib/login-as";
import { passwordProblem } from "@/lib/passwords";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearedRememberCookie, rememberCookie } from "@/lib/supabase/remember";
import { createClient } from "@/lib/supabase/server";

export interface SignInState {
  error?: string;
  /** What was typed, so the form keeps it after an error. */
  identifier?: string;
}

const WRONG_LOGIN = "Username, mobile number, or password is incorrect.";

async function setRememberPreference(remember: boolean) {
  const cookieStore = await cookies();
  const cookie = rememberCookie(remember);
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}

async function clearRememberPreference() {
  const cookieStore = await cookies();
  const cookie = clearedRememberCookie();
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}

/**
 * The internal address for this sign-in text. Profiles are not readable before
 * login, so this uses the server secret key only to find the row.
 */
async function resolveLoginEmail(typed: string): Promise<{ email: string | null; error?: string }> {
  const asMobile = looksLikeMobile(typed);
  const value = asMobile ? normalizeMobile(typed) : normalizeUsername(typed);
  if (!value) return { email: null };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("username, mobile")
    .eq(asMobile ? "mobile" : "username", value)
    .maybeSingle();
  if (error) return { email: null, error: error.message };
  if (!data) return { email: null };
  return { email: loginEmailForProfile(data) };
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const typed = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!typed) return { error: "Enter your username or mobile number.", identifier: typed };
  if (!password) return { error: "Enter your password.", identifier: typed };

  const resolved = await resolveLoginEmail(typed);
  if (resolved.error) return { error: "Could not sign in. Try again.", identifier: typed };
  if (!resolved.email) return { error: WRONG_LOGIN, identifier: typed };

  // Set before sign-in so the auth cookies written in this request follow the choice.
  const remember = formData.get("remember") === "on";
  await setRememberPreference(remember);
  await clearLoginAsProfileId();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolved.email,
    password,
  });
  if (error || !data.user) {
    await clearRememberPreference();
    return { error: WRONG_LOGIN, identifier: typed };
  }

  // Only active profiles are visible to their owner, so a missing row means no access.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    await clearRememberPreference();
    return { error: "This account is not active. Please contact the Admin.", identifier: typed };
  }

  redirect("/home");
}

export async function signOut(): Promise<void> {
  await clearRememberPreference();
  await clearLoginAsProfileId();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Admin-only: view the app as this leader or asst. leader (no password, no OTP).
 * Keeps the Admin Auth session and sets an httpOnly overlay cookie.
 */
export async function loginAsLeader(profileId: string): Promise<{ error?: string }> {
  if (!SUPERADMIN) return { error: "This feature is turned off." };
  const admin = await getRealUser();
  if (!admin || admin.role !== "admin") return { error: "Only the Admin can do that." };
  if (!isUuid(profileId)) return { error: "Could not find that person." };

  const db = createAdminClient();
  const { data: profile, error } = await db
    .from("profiles")
    .select("id, active, is_admin, auth_user_id, group_leaders(role)")
    .eq("id", profileId)
    .maybeSingle();
  if (error) return { error: "Could not open that login. Try again." };
  if (!profile || !profile.active || profile.is_admin) return { error: "Could not find that person." };
  if (!profile.auth_user_id) return { error: "Set up a login for this person first." };
  const memberships = profile.group_leaders ?? [];
  if (!memberships.length) return { error: "This person is not a leader or assistant leader." };

  await setLoginAsProfileId(profile.id);
  revalidatePath("/", "layout");
  redirect("/home");
}

/** Ends Admin login-as and restores the Admin view. */
export async function returnToAdmin(): Promise<void> {
  const admin = await getRealUser();
  if (!admin || admin.role !== "admin") redirect("/home");
  await clearLoginAsProfileId();
  revalidatePath("/", "layout");
  redirect("/people");
}

/** Saves whether titles such as "Bro." show before names on the signed-in person's own screens. */
export async function setShowSalutations(show: boolean): Promise<{ error?: string }> {
  await requireUser();
  if (await getLoginAsProfileId()) return { error: "Back to admin before changing this setting." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_show_salutations", { show });
  if (error) return { error: "Could not save. Try again." };
  revalidatePath("/", "layout");
  return {};
}

export interface ChangePasswordState {
  error?: string;
  saved?: boolean;
}

/** Checks a password without writing session cookies. */
function createPasswordCheckClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}

/** Replaces the signed-in person's password. Does not change anyone else's login. */
export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  await requireUser();
  if (await getLoginAsProfileId()) return { error: "Back to admin before changing the password." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) return { error: "Enter your current password." };
  const problem = passwordProblem(newPassword);
  if (problem) return { error: problem };
  if (newPassword !== confirmPassword) return { error: "New passwords don't match." };

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const authUserId = auth?.claims.sub;
  if (authError || !authUserId) return { error: "Sign in again to change your password." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, mobile")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (profileError || !profile) return { error: "Could not change the password. Try again." };

  const email = loginEmailForProfile(profile);
  if (!email) return { error: "This account has no login. Ask the Admin to set one up." };

  const probe = createPasswordCheckClient();
  const { error: signInError } = await probe.auth.signInWithPassword({ email, password: currentPassword });
  if (signInError) return { error: "Current password is incorrect." };

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: "Could not change the password. Try again." };

  return { saved: true };
}
