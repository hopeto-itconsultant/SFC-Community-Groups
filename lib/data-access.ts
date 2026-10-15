// Reads from Supabase for Server Components and Server Actions. Row Level
// Security decides which rows the signed-in user sees. Pure rules that Client
// Components also need live in report-rules.ts.
import "server-only";
import { cache } from "react";
import type {
  CommunityGroup,
  ContactMode,
  FellowshipReport,
  FollowUpReport,
  Frequency,
  GroupStatus,
  NextFellowship,
  Report,
  ReportType,
  User,
} from "@/data/types";
import { createClient } from "@/lib/supabase/server";
import {
  nextMonthISO,
  splitReportDateTime,
  startOfDayTimestamp,
  startOfLocalDateISO,
  startOfNextDayTimestamp,
  toLocalDateTimeISO,
  todayISO,
} from "./format";
import { photoUrl } from "./photos";
import { fileableFellowshipPlans, type ReportQuery, type ReportTypeSummaries } from "./report-rules";

type GroupRole = "leader" | "asst-leader";

interface GroupRow {
  id: string;
  name: string;
  category: string | null;
  frequency: Frequency | null;
  photo_path: string | null;
  status: GroupStatus;
  closed_at: string | null;
  group_leaders: { profile_id: string; role: GroupRole; created_at: string }[];
}

interface ProfileRow {
  id: string;
  name: string;
  is_admin: boolean;
  group_leaders: { group_id: string; role: GroupRole; created_at: string }[];
}

interface ReportRow {
  id: string;
  group_id: string;
  type: ReportType;
  filed_by: string;
  /** Timestamp without timezone. Midnight means no time was recorded. */
  report_date: string;
  location: string | null;
  comments: string | null;
  attendees: number | null;
  first_timers: number | null;
  summary: string | null;
  /** Postgres numeric; may arrive as a string. */
  expense_amount: number | string | null;
  expense_details: string | null;
  photo_paths: string[] | null;
  person_name: string | null;
  contact_mode: ContactMode | null;
  activity: string | null;
  goals: string | null;
  cancelled_at: string | null;
  created_at: string;
}

const GROUP_COLUMNS =
  "id, name, category, frequency, photo_path, status, closed_at, group_leaders(profile_id, role, created_at)";
const PROFILE_COLUMNS = "id, name, is_admin, group_leaders(group_id, role, created_at)";
const REPORT_COLUMNS =
  "id, group_id, type, filed_by, report_date, location, comments, attendees, first_timers, summary, " +
  "expense_amount, expense_details, photo_paths, person_name, contact_mode, activity, goals, cancelled_at, created_at";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids that are not UUIDs (old links) match nothing instead of making Postgres error. */
const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";

export function isUuid(id: string | undefined): id is string {
  return !!id && UUID.test(id);
}

function idFilter(id: string): string {
  return isUuid(id) ? id : NO_MATCH_ID;
}

function byCreatedAt(a: { created_at: string }, b: { created_at: string }): number {
  return a.created_at.localeCompare(b.created_at);
}

function toGroup(row: GroupRow): CommunityGroup {
  const leaders = [...row.group_leaders].sort(byCreatedAt);
  const idsWithRole = (role: GroupRole) => leaders.filter((l) => l.role === role).map((l) => l.profile_id);
  return {
    id: row.id,
    name: row.name,
    category: row.category || undefined,
    frequency: row.frequency ?? undefined,
    leaderIds: idsWithRole("leader"),
    assistantLeaderIds: idsWithRole("asst-leader"),
    photo: row.photo_path ? photoUrl("group-photos", row.photo_path) : undefined,
    status: row.status,
    closedAt: row.closed_at ? toLocalDateTimeISO(row.closed_at).slice(0, 10) : undefined,
  };
}

/** Admins have no group; anyone else takes role and group from the group they joined first. */
function toUser(row: ProfileRow): User {
  if (row.is_admin) return { id: row.id, name: row.name, role: "admin" };
  const first = [...row.group_leaders].sort(byCreatedAt)[0];
  return { id: row.id, name: row.name, role: first?.role ?? "leader", groupId: first?.group_id };
}

function toReport(row: ReportRow): Report {
  const base = {
    id: row.id,
    groupId: row.group_id,
    filedBy: row.filed_by,
    createdAt: toLocalDateTimeISO(row.created_at),
  };
  const when = splitReportDateTime(row.report_date);
  switch (row.type) {
    case "fellowship":
      return {
        ...base,
        type: "fellowship",
        date: when.date,
        time: when.time,
        location: row.location ?? "",
        attendees: row.attendees ?? 0,
        firstTimers: row.first_timers ?? 0,
        summary: row.summary ?? "",
        comments: row.comments ?? "",
        expenseAmount: row.expense_amount == null ? undefined : Number(row.expense_amount),
        expenseDetails: row.expense_details ?? undefined,
        photos: (row.photo_paths ?? []).map((p) => photoUrl("report-photos", p)),
      };
    case "follow-up":
      return {
        ...base,
        type: "follow-up",
        date: when.date,
        personName: row.person_name ?? "",
        // The reports_fields_match_type check requires contact_mode on follow-ups.
        mode: row.contact_mode as ContactMode,
        comments: row.comments ?? "",
      };
    case "next-fellowship":
      return {
        ...base,
        type: "next-fellowship",
        proposedDate: when.date,
        time: when.time,
        location: row.location ?? "",
        activity: row.activity ?? "",
        goals: row.goals ?? "",
        cancelledAt: row.cancelled_at ? toLocalDateTimeISO(row.cancelled_at) : undefined,
      };
  }
}

/** Unwraps a Supabase response, turning a query error into a thrown Error. */
function unwrap<T>(what: string, { data, error }: { data: unknown; error: { message: string } | null }): T {
  if (error) throw new Error(`Could not load ${what}: ${error.message}`);
  return data as T;
}

const loadGroups = cache(async (includeClosed: boolean): Promise<CommunityGroup[]> => {
  const supabase = await createClient();
  let query = supabase.from("groups").select(GROUP_COLUMNS);
  if (!includeClosed) query = query.eq("status", "active");
  const rows = unwrap<GroupRow[]>("groups", await query);
  return rows.map(toGroup).sort((a, b) => a.name.localeCompare(b.name));
});

/** Active groups by name; closed groups are only included when asked for. */
export async function getGroups({ includeClosed = false }: { includeClosed?: boolean } = {}): Promise<
  CommunityGroup[]
> {
  return loadGroups(includeClosed);
}

export async function getClosedGroupCount(): Promise<number> {
  return (await loadGroups(true)).filter((g) => g.status === "closed").length;
}

/** Served from one cached list so screens can look up many groups per request with one query. */
export async function getGroupById(id: string | undefined): Promise<CommunityGroup | undefined> {
  if (!isUuid(id)) return undefined;
  return (await loadGroups(true)).find((g) => g.id === id);
}

/** Everyone the signed-in user may see, by name; cached so name lookups share one query per request. */
export const getUsers = cache(async (): Promise<User[]> => {
  const supabase = await createClient();
  const rows = unwrap<ProfileRow[]>("people", await supabase.from("profiles").select(PROFILE_COLUMNS).order("name"));
  return rows.map(toUser);
});

export async function getUserById(id: string | undefined): Promise<User | undefined> {
  if (!isUuid(id)) return undefined;
  return (await getUsers()).find((u) => u.id === id);
}

async function getUsersInOrder(ids: string[]): Promise<User[]> {
  if (!ids.length) return [];
  const users = await getUsers();
  return ids.map((id) => users.find((u) => u.id === id)).filter((u): u is User => !!u);
}

export async function getGroupLeaders(group: CommunityGroup): Promise<User[]> {
  return getUsersInOrder(group.leaderIds);
}

export async function getGroupAssistantLeaders(group: CommunityGroup): Promise<User[]> {
  return getUsersInOrder(group.assistantLeaderIds);
}

const loadReports = cache(
  async (
    groupId: string | undefined,
    type: ReportType | undefined,
    period: ReportQuery["period"],
    withExpense: boolean,
  ): Promise<Report[]> => {
    const supabase = await createClient();
    let query = supabase.from("reports").select(REPORT_COLUMNS);
    if (groupId) query = query.eq("group_id", idFilter(groupId));
    if (type) query = query.eq("type", type);
    if (withExpense) query = query.eq("type", "fellowship").gt("expense_amount", 0);
    const today = todayISO();
    if (period === "this-month") {
      query = query
        .gte("created_at", startOfLocalDateISO(`${today.slice(0, 7)}-01`))
        .lt("created_at", startOfLocalDateISO(nextMonthISO(today)));
    } else if (period === "upcoming") {
      query = query.eq("type", "next-fellowship").is("cancelled_at", null).gte("report_date", startOfDayTimestamp(today));
    }
    const rows = unwrap<ReportRow[]>(
      "reports",
      await query.order("report_date", { ascending: false }).order("created_at", { ascending: false }),
    );
    return rows.map(toReport);
  },
);

/** Reports sorted newest first by the date they are about. */
export async function getReports({ groupId, type, period, withExpense = false }: ReportQuery = {}): Promise<
  Report[]
> {
  return loadReports(groupId, type, period, withExpense);
}

export const getReportById = cache(async (id: string | undefined): Promise<Report | undefined> => {
  if (!isUuid(id)) return undefined;
  const supabase = await createClient();
  const row = unwrap<ReportRow | null>(
    "report",
    await supabase.from("reports").select(REPORT_COLUMNS).eq("id", id).maybeSingle(),
  );
  return row ? toReport(row) : undefined;
});

export const getLastFellowship = cache(async (groupId: string): Promise<FellowshipReport | undefined> => {
  const supabase = await createClient();
  const row = unwrap<ReportRow | null>(
    "last fellowship",
    await supabase
      .from("reports")
      .select(REPORT_COLUMNS)
      .eq("group_id", idFilter(groupId))
      .eq("type", "fellowship")
      .lt("report_date", startOfNextDayTimestamp(todayISO()))
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return row ? (toReport(row) as FellowshipReport) : undefined;
});

/** All upcoming plans the user may see, soonest first; one query shared by every group on a screen. */
const loadUpcomingFellowships = cache(async (): Promise<NextFellowship[]> => {
  const supabase = await createClient();
  const rows = unwrap<ReportRow[]>(
    "upcoming fellowships",
    await supabase
      .from("reports")
      .select(REPORT_COLUMNS)
      .eq("type", "next-fellowship")
      .is("cancelled_at", null)
      .gte("report_date", startOfDayTimestamp(todayISO()))
      .order("report_date", { ascending: true })
      .order("created_at", { ascending: true }),
  );
  return rows.map(toReport) as NextFellowship[];
});

/** Upcoming planned fellowships (today or later), soonest first. */
export async function getUpcomingFellowships(groupId?: string): Promise<NextFellowship[]> {
  const all = await loadUpcomingFellowships();
  return groupId ? all.filter((r) => r.groupId === groupId) : all;
}

export async function getNextFellowship(groupId: string): Promise<NextFellowship | undefined> {
  return (await getUpcomingFellowships(groupId))[0];
}

/** Uncancelled plans for this group dated today or earlier that have no fellowship report yet. */
export const getFileableFellowshipPlans = cache(async (groupId: string): Promise<NextFellowship[]> => {
  const supabase = await createClient();
  const group = idFilter(groupId);
  const today = todayISO();
  const [plansResult, filedResult] = await Promise.all([
    supabase
      .from("reports")
      .select(REPORT_COLUMNS)
      .eq("group_id", group)
      .eq("type", "next-fellowship")
      .is("cancelled_at", null)
      .lt("report_date", startOfNextDayTimestamp(today))
      .order("created_at", { ascending: false }),
    supabase.from("reports").select("report_date").eq("group_id", group).eq("type", "fellowship"),
  ]);
  const plans = unwrap<ReportRow[]>("fellowship plans", plansResult).map(toReport) as NextFellowship[];
  const filedDates = unwrap<{ report_date: string }[]>("fellowship dates", filedResult).map(
    (row) => splitReportDateTime(row.report_date).date,
  );
  return fileableFellowshipPlans(plans, filedDates);
});

/** Whether this group already has a fellowship report on `date`. Pass `exceptId` when editing that report. */
export async function hasFellowshipOnDate(groupId: string, date: string, exceptId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select("id")
    .eq("group_id", idFilter(groupId))
    .eq("type", "fellowship")
    .gte("report_date", startOfDayTimestamp(date))
    .lt("report_date", startOfNextDayTimestamp(date));
  if (isUuid(exceptId)) query = query.neq("id", exceptId);
  const rows = unwrap<{ id: string }[]>("fellowship report", await query.limit(1));
  return rows.length > 0;
}

/** True when no later report of the same type has been filed for this group. */
export const isLatestFiledReport = cache(async (report: FellowshipReport | FollowUpReport): Promise<boolean> => {
  const supabase = await createClient();
  const row = unwrap<{ id: string } | null>(
    "latest report",
    await supabase
      .from("reports")
      .select("id")
      .eq("group_id", idFilter(report.groupId))
      .eq("type", report.type)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return row?.id === report.id;
});

/** Reports filed during the current calendar month. */
export async function getReportsFiledThisMonth(groupId?: string): Promise<Report[]> {
  return getReports({ groupId, period: "this-month" });
}

/** Per-type headline numbers for the Reports overview, computed by `public.report_type_summaries`. */
export const getReportTypeSummaries = cache(async (groupId?: string): Promise<ReportTypeSummaries> => {
  const supabase = await createClient();
  return unwrap<ReportTypeSummaries>(
    "report summaries",
    await supabase.rpc("report_type_summaries", { p_group_id: groupId ? idFilter(groupId) : null }),
  );
});

export interface AdminAccount {
  id: string;
  name: string;
  username?: string;
  mobile?: string;
  hasLogin: boolean;
  active: boolean;
}

/** Every admin, active and deactivated, ordered by name. */
export async function getAdmins(): Promise<AdminAccount[]> {
  const supabase = await createClient();
  const rows = unwrap<
    {
      id: string;
      name: string;
      username: string | null;
      mobile: string | null;
      auth_user_id: string | null;
      active: boolean;
    }[]
  >(
    "admins",
    await supabase
      .from("profiles")
      .select("id, name, username, mobile, auth_user_id, active")
      .eq("is_admin", true),
  );
  return rows
    .map((profile) => ({
      id: profile.id,
      name: profile.name,
      username: profile.username ?? undefined,
      mobile: profile.mobile ?? undefined,
      hasLogin: !!profile.auth_user_id,
      active: profile.active,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface GroupMember {
  id: string;
  name: string;
  role: GroupRole;
  mobile?: string;
  dateOfBirth?: string;
  email?: string;
  servingSince?: string;
  hasLogin: boolean;
  active: boolean;
}

/** Leaders and assistant leaders of a group with their login details; for the Admin. */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient();
  const rows = unwrap<
    {
      role: GroupRole;
      created_at: string;
      profiles: {
        id: string;
        name: string;
        mobile: string | null;
        date_of_birth: string | null;
        email: string | null;
        serving_since: string | null;
        auth_user_id: string | null;
        active: boolean;
      };
    }[]
  >(
    "group members",
    await supabase
      .from("group_leaders")
      .select("role, created_at, profiles(id, name, mobile, date_of_birth, email, serving_since, auth_user_id, active)")
      .eq("group_id", idFilter(groupId)),
  );
  const order: Record<GroupRole, number> = { leader: 0, "asst-leader": 1 };
  return rows
    .sort((a, b) => order[a.role] - order[b.role] || byCreatedAt(a, b))
    .map(({ role, profiles: p }) => ({
      id: p.id,
      name: p.name,
      role,
      mobile: p.mobile ?? undefined,
      dateOfBirth: p.date_of_birth ?? undefined,
      email: p.email ?? undefined,
      servingSince: p.serving_since ?? undefined,
      hasLogin: !!p.auth_user_id,
      active: p.active,
    }));
}

export interface LeaderRosterMember {
  id: string;
  name: string;
  role: GroupRole;
  mobile?: string;
  hasLogin: boolean;
  active: boolean;
}

export interface LeaderRosterGroup {
  id: string;
  name: string;
  status: GroupStatus;
  members: LeaderRosterMember[];
}

/** Every leader and assistant leader, grouped by group. Admins are left out. */
export async function getLeaderRoster(): Promise<LeaderRosterGroup[]> {
  const supabase = await createClient();
  const rows = unwrap<
    {
      role: GroupRole;
      profiles: {
        id: string;
        name: string;
        mobile: string | null;
        auth_user_id: string | null;
        active: boolean;
        is_admin: boolean;
      } | null;
      groups: { id: string; name: string; status: GroupStatus } | null;
    }[]
  >(
    "leaders",
    await supabase
      .from("group_leaders")
      .select("role, profiles(id, name, mobile, auth_user_id, active, is_admin), groups(id, name, status)"),
  );

  const byGroup = new Map<string, LeaderRosterGroup>();
  for (const row of rows) {
    const profile = row.profiles;
    const group = row.groups;
    if (!profile || !group || profile.is_admin) continue;
    const bucket = byGroup.get(group.id) ?? {
      id: group.id,
      name: group.name,
      status: group.status,
      members: [],
    };
    bucket.members.push({
      id: profile.id,
      name: profile.name,
      role: row.role,
      mobile: profile.mobile ?? undefined,
      hasLogin: !!profile.auth_user_id,
      active: profile.active,
    });
    byGroup.set(group.id, bucket);
  }

  const roleOrder: Record<GroupRole, number> = { leader: 0, "asst-leader": 1 };
  for (const group of byGroup.values()) {
    group.members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name));
  }

  return [...byGroup.values()].sort((a, b) => {
    const closed = Number(a.status === "closed") - Number(b.status === "closed");
    return closed || a.name.localeCompare(b.name);
  });
}

export interface LeaderProfileGroup {
  id: string;
  name: string;
  role: GroupRole;
  status: GroupStatus;
}

export interface LeaderProfile {
  id: string;
  name: string;
  dateOfBirth?: string;
  email?: string;
  servingSince?: string;
  active: boolean;
  groups: LeaderProfileGroup[];
}

/** One leader or assistant leader, with every group they serve. Admins are left out. */
export async function getLeaderProfile(profileId: string): Promise<LeaderProfile | null> {
  if (!isUuid(profileId)) return null;
  const supabase = await createClient();
  const row = unwrap<
    | {
        id: string;
        name: string;
        date_of_birth: string | null;
        email: string | null;
        serving_since: string | null;
        active: boolean;
        is_admin: boolean;
        group_leaders: {
          role: GroupRole;
          groups: { id: string; name: string; status: GroupStatus } | null;
        }[];
      }
    | null
  >(
    "leader",
    await supabase
      .from("profiles")
      .select("id, name, date_of_birth, email, serving_since, active, is_admin, group_leaders(role, groups(id, name, status))")
      .eq("id", profileId)
      .maybeSingle(),
  );
  if (!row || row.is_admin) return null;
  const groups = row.group_leaders.flatMap((entry) =>
    entry.groups ? [{ id: entry.groups.id, name: entry.groups.name, role: entry.role, status: entry.groups.status }] : [],
  );
  groups.sort((a, b) => a.name.localeCompare(b.name) || a.role.localeCompare(b.role));
  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.date_of_birth ?? undefined,
    email: row.email ?? undefined,
    servingSince: row.serving_since ?? undefined,
    active: row.active,
    groups,
  };
}

export interface AssistantLeader {
  id: string;
  name: string;
  dateOfBirth?: string;
  email?: string;
  servingSince?: string;
  active: boolean;
  groups: { id: string; name: string; status: GroupStatus }[];
}

/**
 * Assistant leaders of these groups, except the person whose page is open.
 * Someone who assists more than one of the groups is listed once.
 */
export async function getAssistantLeaders(groupIds: string[], excludeProfileId: string): Promise<AssistantLeader[]> {
  const ids = [...new Set(groupIds.filter(isUuid))];
  if (!ids.length) return [];

  const supabase = await createClient();
  const rows = unwrap<
    {
      profiles: {
        id: string;
        name: string;
        date_of_birth: string | null;
        email: string | null;
        serving_since: string | null;
        active: boolean;
        is_admin: boolean;
      } | null;
      groups: { id: string; name: string; status: GroupStatus } | null;
    }[]
  >(
    "assistant leaders",
    await supabase
      .from("group_leaders")
      .select("profiles(id, name, date_of_birth, email, serving_since, active, is_admin), groups(id, name, status)")
      .eq("role", "asst-leader")
      .in("group_id", ids),
  );

  const byId = new Map<string, AssistantLeader>();
  for (const row of rows) {
    const profile = row.profiles;
    const group = row.groups;
    if (!profile || !group || profile.is_admin || profile.id === excludeProfileId) continue;
    const existing = byId.get(profile.id);
    const groupRef = { id: group.id, name: group.name, status: group.status };
    if (existing) {
      if (!existing.groups.some((item) => item.id === groupRef.id)) existing.groups.push(groupRef);
      continue;
    }
    byId.set(profile.id, {
      id: profile.id,
      name: profile.name,
      dateOfBirth: profile.date_of_birth ?? undefined,
      email: profile.email ?? undefined,
      servingSince: profile.serving_since ?? undefined,
      active: profile.active,
      groups: [groupRef],
    });
  }

  for (const person of byId.values()) {
    person.groups.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
