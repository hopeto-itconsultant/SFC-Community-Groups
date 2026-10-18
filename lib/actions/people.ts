"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordError, recordSuccess, type ActivityFeature } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/auth";
import { readMobileFields } from "@/lib/countries";
import { isUuid } from "@/lib/data-access";
import { todayISO } from "@/lib/format";
import {
  MOBILE_PATTERN,
  USERNAME_RULE,
  loginEmailForMobile,
  loginEmailForUsername,
  normalizeUsername,
} from "@/lib/login-id";
import { DEFAULT_PASSWORD, passwordProblem } from "@/lib/passwords";
import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./types";

/** Collision copy that never reveals a superadmin's display name. */
function alreadyUsedMessage(value: string, other: { name: string; is_superadmin?: boolean } | null): string | null {
  if (!other) return null;
  if (other.is_superadmin) return `${value} is already used.`;
  return `${value} is already used by ${other.name}.`;
}

function trackFail(
  feature: ActivityFeature,
  action: string,
  summary: string,
  error: string,
): void {
  recordError({ feature, action, summary, errorMessage: error });
}

export interface LoginState extends FormState {
  /** Shown once to the Admin so they can pass the details on. */
  saved?: { name: string; username?: string; mobile?: string; password: string };
  /** What was typed, so the form keeps it after an error. */
  values?: { country: string; mobile: string };
}

export interface CreateAdminState extends FormState {
  /** Shown once so the Admin can pass the new login on. */
  saved?: { name: string; username: string; mobile?: string; password: string };
  /** What was typed, so the form keeps it after an error. */
  values?: { username: string; name: string; country: string; mobile: string };
}

export interface LeaderDetailValues {
  dateOfBirth: string;
  email: string;
  servingSince: string;
}

export interface AddMemberState extends FormState {
  /** What was typed, so the form keeps it after an error. */
  values?: LeaderDetailValues & { name: string; role: string; country: string; mobile: string };
  /** Set when a person was added from the shared logins screen. */
  added?: boolean;
}

export interface MemberDetailsState extends FormState {
  /** What was typed, so the form keeps it after an error. */
  values?: LeaderDetailValues & { name?: string; country?: string; mobile?: string };
  /** Set after the person's details are saved. */
  saved?: boolean;
}

export interface SaveLoginsState {
  error?: string;
  /** People whose phone and password were saved. */
  saved?: { name: string; mobile: string }[];
  /** The shared password, shown once with `saved`. */
  password?: string;
  /** People who could not be saved after earlier ones succeeded. */
  failed?: { name: string; message: string }[];
  /** New names saved when no login was changed. */
  renamed?: string[];
}

async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && isAdminRole(user.role);
}

/**
 * Admins may edit any leader. A leader may edit their own details, and the
 * details of assistant leaders in a group they lead. Returns an error message
 * when the save must stop.
 */
async function memberDetailsBlock(profileId: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return "Only the Admin can edit leaders.";
  if (isAdminRole(user.role)) return null;
  if (user.role !== "leader") return "Only the Admin can edit leaders.";

  const supabase = await createClient();
  const { data: led, error } = await supabase
    .from("group_leaders")
    .select("group_id")
    .eq("profile_id", user.id)
    .eq("role", "leader");
  if (error) return `Could not save the details: ${error.message}`;
  const groupIds = (led ?? []).map((row) => row.group_id);
  if (!groupIds.length) return "Only the Admin can edit leaders.";
  if (user.id === profileId) return null;

  const { data: assistants, error: assistantError } = await supabase
    .from("group_leaders")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("role", "asst-leader")
    .in("group_id", groupIds)
    .limit(1);
  if (assistantError) return `Could not save the details: ${assistantError.message}`;
  return assistants?.length ? null : "Only the Admin can edit leaders.";
}

const memberSchema = z.object({
  name: z.string().trim().min(1, "Enter the person's name.").max(100),
  role: z.enum(["leader", "asst-leader"], "Choose leader or assistant leader."),
});

const adminDisplayNameSchema = z.string().trim().max(100, "Use a shorter name.");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A real YYYY-MM-DD calendar date, or null when the text is not one. */
function calendarDate(value: string): string | null {
  if (!ISO_DATE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return value;
}

interface LeaderDetails {
  dateOfBirth: string | null;
  email: string | null;
  servingSince: string | null;
}

/** Blank details are stored as empty. A typed email or date has to be real, and a date cannot be in the future. */
function readLeaderDetails(values: LeaderDetailValues): { error: string } | { details: LeaderDetails } {
  const dateOfBirth = values.dateOfBirth.trim();
  const email = values.email.trim();
  const servingSince = values.servingSince.trim();

  if (dateOfBirth) {
    if (!calendarDate(dateOfBirth)) return { error: "Enter a valid date of birth." };
    if (dateOfBirth > todayISO()) return { error: "Date of birth cannot be in the future." };
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: "Enter a valid email address." };
  }
  if (servingSince) {
    if (!calendarDate(servingSince)) return { error: "Enter a valid date for when they started serving." };
    if (servingSince > todayISO()) return { error: "The date they started serving cannot be in the future." };
  }

  return {
    details: {
      dateOfBirth: dateOfBirth || null,
      email: email || null,
      servingSince: servingSince || null,
    },
  };
}

function memberFormValues(formData: FormData): NonNullable<AddMemberState["values"]> {
  const phone = readMobileFields(formData);
  return {
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
    country: phone.country,
    mobile: phone.national,
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    email: String(formData.get("email") ?? ""),
    servingSince: String(formData.get("servingSince") ?? ""),
  };
}

function detailValues(formData: FormData): LeaderDetailValues {
  return {
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    email: String(formData.get("email") ?? ""),
    servingSince: String(formData.get("servingSince") ?? ""),
  };
}

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
  const phone = readMobileFields(formData);
  const values = memberFormValues(formData);
  const fail = (error: string): AddMemberState => {
    trackFail("people", "member_add", "Add leader failed", error);
    return { error, values };
  };
  if (!(await isAdmin())) return fail("Only the Admin can add leaders.");

  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const read = readLeaderDetails(values);
  if ("error" in read) return fail(read.error);
  if (phone.national && !phone.mobile) return fail("Enter a valid mobile number, e.g. 9876543210.");
  const mobile = phone.mobile;
  const { details } = read;

  const supabase = await createClient();
  let profileId: string | undefined;
  if (mobile) {
    const { data } = await supabase.from("profiles").select("id").eq("mobile", mobile).maybeSingle();
    profileId = data?.id;
  }
  if (!profileId) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        name: parsed.data.name,
        mobile,
        date_of_birth: details.dateOfBirth,
        email: details.email,
        serving_since: details.servingSince,
      })
      .select("id")
      .single();
    if (error) return fail(`Could not add the person: ${error.message}`);
    profileId = data.id;
  } else {
    const patch: { date_of_birth?: string; email?: string; serving_since?: string } = {};
    if (details.dateOfBirth) patch.date_of_birth = details.dateOfBirth;
    if (details.email) patch.email = details.email;
    if (details.servingSince) patch.serving_since = details.servingSince;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from("profiles").update(patch).eq("id", profileId);
      if (error) return fail(`Could not save the details: ${error.message}`);
    }
  }

  const { error } = await supabase
    .from("group_leaders")
    .insert({ group_id: groupId, profile_id: profileId, role: parsed.data.role });
  if (error) {
    return fail(error.code === "23505" ? "This person is already in the group." : `Could not add: ${error.message}`);
  }

  recordSuccess({
    feature: "people",
    action: "member_add",
    summary: `Added ${parsed.data.name} to a group`,
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/", "layout");
  return {};
}

/** Adds a leader from the shared logins screen, where the group is chosen on the form. */
export async function addRosterMember(_prev: AddMemberState, formData: FormData): Promise<AddMemberState> {
  const values = memberFormValues(formData);
  const groupId = String(formData.get("groupId") ?? "");
  if (!isUuid(groupId)) {
    trackFail("people", "member_add", "Add leader failed", "Choose a group.");
    return { error: "Choose a group.", values };
  }
  const result = await addMember(groupId, _prev, formData);
  return result.error ? result : { added: true };
}

/**
 * Saves the mobile number when the form includes one, and keeps sign-in working.
 * A blank number is stored only when they do not already sign in with it.
 * Returns an error message, or null.
 */
async function saveDetailsMobile(profileId: string, nextMobile: string | null): Promise<string | null> {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, mobile, auth_user_id, username")
    .eq("id", profileId)
    .eq("is_admin", false)
    .maybeSingle();
  if (error || !profile) return "Could not find that person.";
  if (nextMobile === profile.mobile) return null;
  if (!nextMobile && profile.auth_user_id && !profile.username) {
    return "Enter a mobile number. They sign in with it.";
  }
  if (nextMobile) {
    const taken = await mobileTakenBy(admin, nextMobile, profileId);
    if (taken) return taken;
  }

  if (profile.auth_user_id && !profile.username && nextMobile) {
    const { error: authError } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
      email: loginEmailForMobile(nextMobile),
      email_confirm: true,
    });
    if (authError) return `Could not update the sign-in number: ${authError.message}`;
  }

  const { error: mobileError } = await admin.from("profiles").update({ mobile: nextMobile }).eq("id", profileId);
  if (mobileError) {
    if (profile.auth_user_id && !profile.username && nextMobile && profile.mobile) {
      await admin.auth.admin.updateUserById(profile.auth_user_id, {
        email: loginEmailForMobile(profile.mobile),
        email_confirm: true,
      });
    }
    return `Could not save the mobile number: ${mobileError.message}`;
  }
  return null;
}

/**
 * Saves date of birth, email, the date they started serving, and the mobile number when the form has one.
 * Blank date and email fields clear the stored value. A blank mobile number does too, unless they sign in with it.
 * A submitted name is saved too. A form without a name field leaves the name as it is.
 * An Admin may save any leader. A leader may save themselves and the assistant leaders of a group they lead.
 */
export async function updateMemberDetails(
  profileId: string,
  _prev: MemberDetailsState,
  formData: FormData,
): Promise<MemberDetailsState> {
  const rawName = formData.get("name");
  const phone = formData.has("mobile") ? readMobileFields(formData) : null;
  const values = {
    ...detailValues(formData),
    ...(rawName === null ? {} : { name: String(rawName) }),
    ...(phone ? { country: phone.country, mobile: phone.national } : {}),
  };
  const fail = (error: string): MemberDetailsState => {
    trackFail("people", "member_details_update", "Leader details update failed", error);
    return { error, values };
  };
  if (!isUuid(profileId)) return fail("Could not find that person.");
  const blocked = await memberDetailsBlock(profileId);
  if (blocked) return fail(blocked);

  const read = readLeaderDetails(values);
  if ("error" in read) return fail(read.error);
  if (phone?.national && !phone.mobile) return fail("Enter a valid mobile number, e.g. 9876543210.");

  let name: string | undefined;
  if (rawName !== null) {
    const parsed = personNameSchema.safeParse(String(rawName));
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    name = parsed.data;
  }

  if (phone) {
    const mobileError = await saveDetailsMobile(profileId, phone.mobile);
    if (mobileError) return fail(mobileError);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(name ? { name } : {}),
      date_of_birth: read.details.dateOfBirth,
      email: read.details.email,
      serving_since: read.details.servingSince,
    })
    .eq("id", profileId)
    .eq("is_admin", false)
    .select("id")
    .maybeSingle();
  if (error) return fail(`Could not save the details: ${error.message}`);
  if (!data) return fail("Could not find that person.");

  recordSuccess({
    feature: "people",
    action: "member_details_update",
    summary: "Updated leader details",
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function removeMember(groupId: string, profileId: string): Promise<FormState> {
  if (!(await isAdmin())) {
    trackFail("people", "member_remove", "Remove leader failed", "Only the Admin can remove leaders.");
    return { error: "Only the Admin can remove leaders." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_leaders")
    .delete()
    .eq("group_id", groupId)
    .eq("profile_id", profileId);
  if (error) {
    trackFail("people", "member_remove", "Remove leader failed", `Could not remove: ${error.message}`);
    return { error: `Could not remove: ${error.message}` };
  }

  recordSuccess({
    feature: "people",
    action: "member_remove",
    summary: "Removed leader from group",
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/", "layout");
  return {};
}

type AdminClient = ReturnType<typeof createAdminClient>;

/** Creates the login or replaces its mobile and password. Returns an error message, or null. */
async function writeLogin(
  admin: AdminClient,
  profile: { id: string; auth_user_id: string | null },
  mobile: string,
  password: string,
): Promise<string | null> {
  const email = loginEmailForMobile(mobile);
  if (profile.auth_user_id) {
    const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
      email,
      password,
      email_confirm: true,
    });
    if (error) return `Could not update the login: ${error.message}`;
    const { error: mobileError } = await admin.from("profiles").update({ mobile }).eq("id", profile.id);
    if (mobileError) return `Could not save the mobile number: ${mobileError.message}`;
    return null;
  }

  const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return `Could not create the login: ${error.message}`;
  const { error: linkError } = await admin
    .from("profiles")
    .update({ auth_user_id: created.user.id, mobile })
    .eq("id", profile.id);
  if (linkError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return `Could not link the login: ${linkError.message}`;
  }
  return null;
}

/** Creates the person's login, or changes its mobile number and password if they have one. */
export async function setLogin(profileId: string, _prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = readMobileFields(formData);
  const values = { country: phone.country, mobile: phone.national };
  const fail = (error: string): LoginState => {
    trackFail("people", "login_set", "Set login failed", error);
    return { error, values };
  };
  if (!(await isAdmin())) return fail("Only the Admin can set up logins.");

  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return fail(problem);
  if (phone.national && !phone.mobile) return fail("Enter a valid mobile number, e.g. 9876543210.");

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, name, username, mobile, auth_user_id")
    .eq("id", profileId)
    .single();
  if (profileError) return fail(`Could not find the person: ${profileError.message}`);

  if (profile.username) {
    if (!profile.auth_user_id) return fail("This admin does not have a login yet.");
    const nextMobile = phone.mobile;
    if (nextMobile && nextMobile !== profile.mobile) {
      const { data: other } = await admin
        .from("profiles")
        .select("name, is_superadmin")
        .eq("mobile", nextMobile)
        .neq("id", profileId)
        .maybeSingle();
      const taken = alreadyUsedMessage(nextMobile, other);
      if (taken) return fail(taken);
    }

    const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, { password });
    if (error) return fail(`Could not update the login: ${error.message}`);

    let mobile = profile.mobile;
    if (nextMobile && nextMobile !== profile.mobile) {
      const { error: mobileError } = await admin.from("profiles").update({ mobile: nextMobile }).eq("id", profile.id);
      if (mobileError) return fail(`Could not save the mobile number: ${mobileError.message}`);
      mobile = nextMobile;
    }

    recordSuccess({
      feature: "admins",
      action: "login_set",
      summary: `Updated login for ${profile.name}`,
      entityType: "profile",
      entityId: profileId,
    });
    revalidatePath("/", "layout");
    return {
      saved: { name: profile.name, username: profile.username, mobile: mobile ?? undefined, password },
    };
  }

  if (!phone.mobile) return fail("Enter a valid mobile number, e.g. 9876543210.");
  const mobile = phone.mobile;

  const { data: other } = await admin
    .from("profiles")
    .select("name, is_superadmin")
    .eq("mobile", mobile)
    .neq("id", profileId)
    .maybeSingle();
  const taken = alreadyUsedMessage(mobile, other);
  if (taken) return fail(taken);

  const message = await writeLogin(admin, profile, mobile, password);
  if (message) return fail(message);

  recordSuccess({
    feature: "people",
    action: "login_set",
    summary: `Set login for ${profile.name}`,
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/", "layout");
  return { saved: { name: profile.name, mobile, password } };
}

/** Creates another Admin: a username login and a profile. The first Admin still comes from `npm run create-admin`. */
export async function createAdmin(_prev: CreateAdminState, formData: FormData): Promise<CreateAdminState> {
  const phone = readMobileFields(formData);
  const values = {
    username: String(formData.get("username") ?? ""),
    name: String(formData.get("name") ?? ""),
    country: phone.country,
    mobile: phone.national,
  };
  const fail = (error: string): CreateAdminState => {
    trackFail("admins", "admin_create", "Create admin failed", error);
    return { error, values };
  };
  if (!(await isAdmin())) return fail("Only an Admin can add admins.");

  const username = normalizeUsername(values.username);
  if (!username) return fail(values.username.trim() ? USERNAME_RULE : "Enter a username.");
  const parsedName = adminDisplayNameSchema.safeParse(values.name);
  if (!parsedName.success) return fail(parsedName.error.issues[0].message);
  if (phone.national && !phone.mobile) return fail("Enter a valid mobile number, e.g. 9876543210.");
  const mobile = phone.mobile;
  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return fail(problem);

  const name = parsedName.data || username;
  const admin = createAdminClient();
  const { data: takenUsername } = await admin
    .from("profiles")
    .select("name, is_superadmin")
    .eq("username", username)
    .maybeSingle();
  const usernameTaken = alreadyUsedMessage(username, takenUsername);
  if (usernameTaken) return fail(usernameTaken);
  if (mobile) {
    const { data: takenMobile } = await admin
      .from("profiles")
      .select("name, is_superadmin")
      .eq("mobile", mobile)
      .maybeSingle();
    const mobileTaken = alreadyUsedMessage(mobile, takenMobile);
    if (mobileTaken) return fail(mobileTaken);
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: loginEmailForUsername(username),
    password,
    email_confirm: true,
  });
  if (error || !created.user) return fail(`Could not create the login: ${error?.message ?? "no user was returned."}`);

  const { error: profileError } = await admin.from("profiles").insert({
    auth_user_id: created.user.id,
    name,
    username,
    mobile,
    is_admin: true,
    is_superadmin: false,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return fail(`Could not add the admin: ${profileError.message}`);
  }

  recordSuccess({
    feature: "admins",
    action: "admin_create",
    summary: `Created admin ${name}`,
    entityType: "profile",
  });
  revalidatePath("/", "layout");
  return { saved: { name, username, mobile: mobile ?? undefined, password } };
}

/** Turns an Admin's login off or back on. You can't deactivate yourself or the last active Admin. */
export async function setAdminActive(profileId: string, active: boolean): Promise<FormState> {
  const action = "admin_set_active";
  if (!(await isAdmin())) {
    trackFail("admins", action, "Admin active change failed", "Only an Admin can change admins.");
    return { error: "Only an Admin can change admins." };
  }
  if (!isUuid(profileId)) {
    trackFail("admins", action, "Admin active change failed", "Could not find that admin.");
    return { error: "Could not find that admin." };
  }

  const user = await getCurrentUser();
  if (!active && user?.id === profileId) {
    trackFail("admins", action, "Admin active change failed", "You can't deactivate your own login.");
    return { error: "You can't deactivate your own login." };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, name, is_admin, is_superadmin, active")
    .eq("id", profileId)
    .maybeSingle();
  if (profileError || !profile?.is_admin || profile.is_superadmin) {
    trackFail("admins", action, "Admin active change failed", "Could not find that admin.");
    return { error: "Could not find that admin." };
  }

  if (!active && profile.active) {
    const { count, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true)
      .eq("is_superadmin", false)
      .eq("active", true);
    if (countError) {
      trackFail("admins", action, "Admin active change failed", `Could not check admins: ${countError.message}`);
      return { error: `Could not check admins: ${countError.message}` };
    }
    if ((count ?? 0) <= 1) {
      trackFail("admins", action, "Admin active change failed", "Keep at least one active Admin.");
      return { error: "Keep at least one active Admin." };
    }
  }

  const { error } = await admin.from("profiles").update({ active }).eq("id", profileId).eq("is_admin", true);
  if (error) {
    trackFail("admins", action, "Admin active change failed", `Could not update the admin: ${error.message}`);
    return { error: `Could not update the admin: ${error.message}` };
  }

  recordSuccess({
    feature: "admins",
    action,
    summary: active ? `Reactivated admin ${profile.name}` : `Deactivated admin ${profile.name}`,
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/", "layout");
  return {};
}

interface LoginTarget {
  id: string;
  name: string;
  mobile: string | null;
  auth_user_id: string | null;
  active: boolean;
  is_admin: boolean;
  is_superadmin: boolean;
}

const personNameSchema = z.string().trim().min(1, "Enter the person's name.").max(100, "Use a shorter name.");

export interface IssuedLogin {
  name: string;
  mobile: string;
  password: string;
}

export interface LeaderRecordState {
  error?: string;
  /** A login just created. The password is shown once. */
  login?: IssuedLogin;
  /** An existing login was saved without changing its password. */
  passwordUnchanged?: boolean;
}

/**
 * Saves one person's name and, when a mobile is given, that number.
 * A blank mobile is left unchanged and does not create a login.
 * A mobile for someone without a login creates one with the shared default password.
 * An existing login keeps its password; a changed number updates the sign-in address only.
 */
export async function saveLeaderRecord(input: {
  profileId: string;
  name: string;
  mobile?: string;
}): Promise<LeaderRecordState> {
  const fail = (error: string): LeaderRecordState => {
    trackFail("people", "leader_record_save", "Leader record save failed", error);
    return { error };
  };
  if (!(await isAdmin())) return fail("Only the Admin can edit leaders.");
  if (!isUuid(input.profileId)) return fail("Could not find that person.");
  const parsed = personNameSchema.safeParse(input.name);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const mobile = input.mobile?.trim() ?? "";
  if (mobile && !MOBILE_PATTERN.test(mobile)) return fail("Enter a valid mobile number, e.g. 9876543210.");

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, name, mobile, auth_user_id, active, is_admin, is_superadmin")
    .eq("id", input.profileId)
    .maybeSingle();
  if (profileError || !profile || profile.is_admin || profile.is_superadmin || !profile.active) {
    return fail("Could not find that person.");
  }

  const name = parsed.data;
  const phoneChanged = Boolean(mobile) && mobile !== profile.mobile;
  if (phoneChanged) {
    const taken = await mobileTakenBy(admin, mobile, profile.id);
    if (taken) return fail(taken);
  }

  if (mobile && !profile.auth_user_id) {
    if (name !== profile.name) {
      const { error } = await admin.from("profiles").update({ name }).eq("id", profile.id);
      if (error) return fail(`Could not save: ${error.message}`);
    }
    const password = DEFAULT_PASSWORD;
    const message = await writeLogin(admin, profile, mobile, password);
    if (message) return fail(message);
    recordSuccess({
      feature: "people",
      action: "login_set",
      summary: `Created login for ${name}`,
      entityType: "profile",
      entityId: profile.id,
    });
    revalidatePath("/", "layout");
    return { login: { name, mobile, password } };
  }

  if (phoneChanged && profile.auth_user_id) {
    const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
      email: loginEmailForMobile(mobile),
      email_confirm: true,
    });
    if (error) return fail(`Could not update the sign-in number: ${error.message}`);
  }

  if (phoneChanged || name !== profile.name) {
    const patch: { name: string; mobile?: string } = { name };
    if (phoneChanged) patch.mobile = mobile;
    const { error } = await admin.from("profiles").update(patch).eq("id", profile.id);
    if (error) return fail(`Could not save: ${error.message}`);
  }

  recordSuccess({
    feature: "people",
    action: "leader_record_save",
    summary: `Updated ${name}`,
    entityType: "profile",
    entityId: profile.id,
  });
  revalidatePath("/", "layout");
  if (mobile && profile.auth_user_id) return { passwordUnchanged: true };
  return {};
}

/** Replaces the password on an existing leader login. Does not run as part of save. */
export async function resetLeaderPassword(profileId: string): Promise<{ error?: string; login?: IssuedLogin }> {
  const fail = (error: string) => {
    trackFail("people", "password_reset", "Password reset failed", error);
    return { error };
  };
  if (!(await isAdmin())) return fail("Only the Admin can edit leaders.");
  if (!isUuid(profileId)) return fail("Could not find that person.");

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, name, mobile, auth_user_id, active, is_admin, is_superadmin")
    .eq("id", profileId)
    .maybeSingle();
  if (profileError || !profile || profile.is_admin || profile.is_superadmin || !profile.active) {
    return fail("Could not find that person.");
  }
  if (!profile.auth_user_id || !profile.mobile) return fail("This person does not have a login yet.");

  const password = DEFAULT_PASSWORD;
  const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, { password });
  if (error) return fail(`Could not reset the password: ${error.message}`);

  recordSuccess({
    feature: "people",
    action: "password_reset",
    summary: `Reset password for ${profile.name}`,
    entityType: "profile",
    entityId: profile.id,
  });
  revalidatePath("/", "layout");
  return { login: { name: profile.name, mobile: profile.mobile, password } };
}

/** An error message when another person already uses this mobile, or null. */
async function mobileTakenBy(admin: AdminClient, mobile: string, profileId: string): Promise<string | null> {
  const { data: other } = await admin
    .from("profiles")
    .select("name, is_superadmin")
    .eq("mobile", mobile)
    .neq("id", profileId)
    .maybeSingle();
  return alreadyUsedMessage(mobile, other);
}

/**
 * Sets one shared password, and the typed phone number, for every included person.
 * Blank numbers are ignored. Changed names are saved even when the phone is left
 * blank, and a name-only save does not reset any login.
 */
export async function saveLeaderLogins(input: {
  password: string;
  people: { profileId: string; mobile: string }[];
  names?: { profileId: string; name: string }[];
}): Promise<SaveLoginsState> {
  if (!(await isAdmin())) return { error: "Only the Admin can set up logins." };

  const included: { profileId: string; mobile: string }[] = [];
  for (const person of input.people) {
    if (!isUuid(person.profileId)) return { error: "Could not read the list of people." };
    const mobile = person.mobile.trim();
    if (!mobile) continue;
    // Already joined with the selected country. Do not treat a 10-digit result as Indian.
    if (!MOBILE_PATTERN.test(mobile)) return { error: "Enter a valid mobile number, e.g. 9876543210." };
    included.push({ profileId: person.profileId, mobile });
  }

  const renames: { profileId: string; name: string }[] = [];
  const nameByProfile = new Map<string, string>();
  for (const entry of input.names ?? []) {
    if (!isUuid(entry.profileId)) return { error: "Could not read the list of people." };
    const parsed = personNameSchema.safeParse(entry.name);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const previous = nameByProfile.get(entry.profileId);
    if (previous && previous !== parsed.data) return { error: "Enter one name per person." };
    if (previous) continue;
    nameByProfile.set(entry.profileId, parsed.data);
    renames.push({ profileId: entry.profileId, name: parsed.data });
  }

  if (!included.length && !renames.length) return { error: "Enter at least one mobile number." };
  if (included.length) {
    const problem = passwordProblem(input.password);
    if (problem) return { error: problem };
  }

  const mobileByProfile = new Map<string, string>();
  const ownerByMobile = new Map<string, string>();
  for (const entry of included) {
    const previous = mobileByProfile.get(entry.profileId);
    if (previous && previous !== entry.mobile) return { error: "Enter one mobile number per person." };
    mobileByProfile.set(entry.profileId, entry.mobile);
    const owner = ownerByMobile.get(entry.mobile);
    if (owner && owner !== entry.profileId) return { error: `${entry.mobile} is entered for more than one person.` };
    ownerByMobile.set(entry.mobile, entry.profileId);
  }

  const admin = createAdminClient();
  const ids = [...new Set([...mobileByProfile.keys(), ...nameByProfile.keys()])];
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, name, mobile, auth_user_id, active, is_admin, is_superadmin")
    .in("id", ids);
  if (profileError) return { error: `Could not load people: ${profileError.message}` };

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile as LoginTarget]));
  const renamed: string[] = [];
  for (const entry of renames) {
    const profile = profileById.get(entry.profileId);
    if (!profile) {
      if (renamed.length) revalidatePath("/", "layout");
      return { error: "Could not find that person." };
    }
    if (profile.is_admin || profile.is_superadmin || !profile.active || profile.name === entry.name) continue;
    const { error } = await admin.from("profiles").update({ name: entry.name }).eq("id", profile.id);
    if (error) {
      if (renamed.length) revalidatePath("/", "layout");
      return { error: `Could not save the name: ${error.message}` };
    }
    profile.name = entry.name;
    renamed.push(entry.name);
  }

  if (!included.length) {
    if (!renamed.length) return { error: "Enter at least one mobile number." };
    revalidatePath("/", "layout");
    return { renamed };
  }

  const { data: holders, error: holderError } = await admin
    .from("profiles")
    .select("id, name, mobile, is_superadmin")
    .in("mobile", [...ownerByMobile.keys()]);
  if (holderError) {
    if (renamed.length) revalidatePath("/", "layout");
    return { error: `Could not check mobile numbers: ${holderError.message}` };
  }

  for (const holder of holders ?? []) {
    if (!holder.mobile) continue;
    const intended = ownerByMobile.get(holder.mobile);
    if (!intended || intended === holder.id) continue;
    const movingTo = mobileByProfile.get(holder.id);
    if (movingTo && movingTo !== holder.mobile) continue;
    if (renamed.length) revalidatePath("/", "layout");
    return { error: alreadyUsedMessage(holder.mobile, holder) ?? `${holder.mobile} is already used.` };
  }

  const pending: LoginTarget[] = [];
  for (const id of mobileByProfile.keys()) {
    const profile = profileById.get(id);
    if (!profile || profile.is_admin || profile.is_superadmin || !profile.active) continue;
    pending.push(profile);
  }
  if (!pending.length) {
    if (renamed.length) {
      revalidatePath("/", "layout");
      return { renamed };
    }
    return { error: "Enter at least one mobile number." };
  }

  const saved: { name: string; mobile: string }[] = [];
  const failed: { name: string; message: string }[] = [];
  const remaining = new Set(pending.map((profile) => profile.id));
  const currentMobile = new Map(pending.map((profile) => [profile.id, profile.mobile]));

  while (remaining.size) {
    const ready = [...remaining].filter((id) => !numberStillHeld(id, mobileByProfile, currentMobile, remaining));
    const nextId = ready[0] ?? [...remaining][0];
    remaining.delete(nextId);
    const profile = profileById.get(nextId);
    const mobile = profile ? mobileByProfile.get(nextId) : undefined;
    if (!profile || !mobile) continue;
    const message = await writeLogin(admin, profile, mobile, input.password);
    if (message) failed.push({ name: profile.name, message });
    else {
      saved.push({ name: profile.name, mobile });
      currentMobile.set(profile.id, mobile);
    }
  }

  if (saved.length || renamed.length) revalidatePath("/", "layout");
  if (!saved.length) return { error: failed[0]?.message ?? "Could not save the logins.", failed };
  return { saved, password: input.password, failed: failed.length ? failed : undefined };
}

/** True when someone still to be saved currently holds this person's new number. */
function numberStillHeld(
  profileId: string,
  mobileByProfile: Map<string, string>,
  currentMobile: Map<string, string | null>,
  remaining: Set<string>,
): boolean {
  const mobile = mobileByProfile.get(profileId);
  for (const otherId of remaining) {
    if (otherId !== profileId && currentMobile.get(otherId) === mobile) return true;
  }
  return false;
}
