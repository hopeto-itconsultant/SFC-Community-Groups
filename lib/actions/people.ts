"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { loginEmailForMobile, normalizeMobile } from "@/lib/login-id";
import { passwordProblem } from "@/lib/passwords";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./types";

export interface LoginState extends FormState {
  /** Shown once to the Admin so they can pass the details on. */
  saved?: { name: string; mobile: string; password: string };
}

export interface AddMemberState extends FormState {
  /** What was typed, so the form keeps it after an error. */
  values?: { name: string; role: string; mobile: string };
}

async function isAdmin(): Promise<boolean> {
  return (await getCurrentUser())?.role === "admin";
}

const memberSchema = z.object({
  name: z.string().trim().min(1, "Enter the person's name.").max(100),
  role: z.enum(["leader", "asst-leader"], "Choose leader or assistant leader."),
});

/**
 * Adds a leader or assistant leader to a group. If the mobile number belongs
 * to someone already in the app (e.g. they serve another group), that person
 * is added instead of creating a duplicate.
 */
export async function addMember(
  groupId: string,
  _prev: AddMemberState,
  formData: FormData,
): Promise<AddMemberState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
    mobile: String(formData.get("mobile") ?? "").trim(),
  };
  const fail = (error: string): AddMemberState => ({ error, values });
  if (!(await isAdmin())) return fail("Only the Admin can add leaders.");

  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const mobile = values.mobile ? normalizeMobile(values.mobile) : null;
  if (values.mobile && !mobile) return fail("Enter a valid mobile number, e.g. 9876543210.");

  const supabase = await createClient();
  let profileId: string | undefined;
  if (mobile) {
    const { data } = await supabase.from("profiles").select("id").eq("mobile", mobile).maybeSingle();
    profileId = data?.id;
  }
  if (!profileId) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ name: parsed.data.name, mobile })
      .select("id")
      .single();
    if (error) return fail(`Could not add the person: ${error.message}`);
    profileId = data.id;
  }

  const { error } = await supabase
    .from("group_leaders")
    .insert({ group_id: groupId, profile_id: profileId, role: parsed.data.role });
  if (error) {
    return fail(error.code === "23505" ? "This person is already in the group." : `Could not add: ${error.message}`);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function removeMember(groupId: string, profileId: string): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Only the Admin can remove leaders." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_leaders")
    .delete()
    .eq("group_id", groupId)
    .eq("profile_id", profileId);
  if (error) return { error: `Could not remove: ${error.message}` };

  revalidatePath("/", "layout");
  return {};
}

/** Creates the person's login, or changes its mobile number and password if they have one. */
export async function setLogin(profileId: string, _prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!(await isAdmin())) return { error: "Only the Admin can set up logins." };

  const mobile = normalizeMobile(String(formData.get("mobile") ?? ""));
  if (!mobile) return { error: "Enter a valid mobile number, e.g. 9876543210." };
  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, name, auth_user_id")
    .eq("id", profileId)
    .single();
  if (profileError) return { error: `Could not find the person: ${profileError.message}` };

  const { data: other } = await admin
    .from("profiles")
    .select("name")
    .eq("mobile", mobile)
    .neq("id", profileId)
    .maybeSingle();
  if (other) return { error: `${mobile} is already used by ${other.name}.` };

  const email = loginEmailForMobile(mobile);
  if (profile.auth_user_id) {
    const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
      email,
      password,
      email_confirm: true,
    });
    if (error) return { error: `Could not update the login: ${error.message}` };
    const { error: mobileError } = await admin.from("profiles").update({ mobile }).eq("id", profileId);
    if (mobileError) return { error: `Could not save the mobile number: ${mobileError.message}` };
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return { error: `Could not create the login: ${error.message}` };
    const { error: linkError } = await admin
      .from("profiles")
      .update({ auth_user_id: created.user.id, mobile })
      .eq("id", profileId);
    if (linkError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { error: `Could not link the login: ${linkError.message}` };
    }
  }

  revalidatePath("/", "layout");
  return { saved: { name: profile.name, mobile, password } };
}
