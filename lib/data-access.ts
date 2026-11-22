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

interface GroupLeaderJoin {
  profile_id: string;
  role: GroupRole;
  created_at: string;
  profiles: { name: string } | { name: string }[] | null;
}

interface GroupRow {
  id: string;
  name: string;
  category: string | null;
  frequency: Frequency | null;
  photo_path: string | null;
  status: GroupStatus;
  closed_at: string | null;
  group_leaders: GroupLeaderJoin[];
}

interface ProfileRow {
  id: string;
  name: string;
  is_admin: boolean;
  is_superadmin: boolean;
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
  groups?: { name: string } | { name: string }[] | null;
  filer?: { name: string } | { name: string }[] | null;
}

const GROUP_COLUMNS =
  "id, name, category, frequency, photo_path, status, closed_at, group_leaders(profile_id, role, created_at, profiles(name))";
const PROFILE_COLUMNS = "id, name, is_admin, is_superadmin, group_leaders(group_id, role, created_at)";
const REPORT_COLUMNS =
  "id, group_id, type, filed_by, report_date, location, comments, attendees, first_timers, summary, " +
  "expense_amount, expense_details, photo_paths, person_name, contact_mode, activity, goals, cancelled_at, created_at";
const REPORT_LIST_COLUMNS =
  `${REPORT_COLUMNS}, groups!reports_group_id_fkey(name), filer:profiles!reports_filed_by_fkey(name)`;

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
  if (row.is_superadmin) return { id: row.id, name: row.name, role: "superadmin" };
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

export interface DirectoryPerson {
  id: string;
  name: string;
}

export interface GroupDirectoryEntry {
  group: CommunityGroup;
  leaders: DirectoryPerson[];
  assistants: DirectoryPerson[];
}

export interface GroupChoice {
  id: string;
  name: string;
  status: GroupStatus;
}

function embeddedName(value: { name: string } | { name: string }[] | null | undefined): string {
  if (!value) return "";
  const row = Array.isArray(value) ? value[0] : value;
  return row?.name ?? "";
}

function toDirectoryEntry(row: GroupRow): GroupDirectoryEntry {
  const leaders = [...row.group_leaders].sort(byCreatedAt);
  const people = (role: GroupRole) =>
    leaders
      .filter((leader) => leader.role === role)
      .map((leader) => ({ id: leader.profile_id, name: embeddedName(leader.profiles) }));
  return { group: toGroup(row), leaders: people("leader"), assistants: people("asst-leader") };
}

const loadGroupDirectory = cache(async (includeClosed: boolean): Promise<GroupDirectoryEntry[]> => {
  const supabase = await createClient();
  let query = supabase.from("groups").select(GROUP_COLUMNS);
  if (!includeClosed) query = query.eq("status", "active");
  const rows = unwrap<GroupRow[]>("groups", await query);
  return rows.map(toDirectoryEntry).sort((a, b) => a.group.name.localeCompare(b.group.name));
});

/** Active groups by name; closed groups are only included when asked for. */
export async function getGroups({ includeClosed = false }: { includeClosed?: boolean } = {}): Promise<
  CommunityGroup[]
> {
  return (await loadGroupDirectory(includeClosed)).map((entry) => entry.group);
}

/** Groups with leader and assistant names, from the same query as `getGroups`. */
export async function getGroupDirectory({ includeClosed = false }: { includeClosed?: boolean } = {}): Promise<
  GroupDirectoryEntry[]
> {
  return loadGroupDirectory(includeClosed);
}

/** Id, name, and status only — for filters and pickers that do not show leaders. */
export const getGroupChoices = cache(async (): Promise<GroupChoice[]> => {
  const supabase = await createClient();
  const rows = unwrap<GroupChoice[]>(
    "groups",
    await supabase.from("groups").select("id, name, status").order("name"),
  );
  return rows;
});

export async function getClosedGroupCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("status", "closed");
  if (error) throw new Error(`Could not count groups: ${error.message}`);
  return count ?? 0;
}

const loadGroupDetail = cache(async (id: string): Promise<GroupDirectoryEntry | undefined> => {
  const supabase = await createClient();
  const row = unwrap<GroupRow | null>(
    "group",
    await supabase.from("groups").select(GROUP_COLUMNS).eq("id", id).maybeSingle(),
  );
  return row ? toDirectoryEntry(row) : undefined;
});

/** One group, including its leaders' names. Does not load the rest of the directory. */
export async function getGroupDetail(id: string | undefined): Promise<GroupDirectoryEntry | undefined> {
  if (!isUuid(id)) return undefined;
  return loadGroupDetail(id);
}

export async function getGroupById(id: string | undefined): Promise<CommunityGroup | undefined> {
  return (await getGroupDetail(id))?.group;
}

/** Everyone the signed-in user may see, by name; cached so name lookups share one query per request. */
export const getUsers = cache(async (): Promise<User[]> => {
  const supabase = await createClient();
  const rows = unwrap<ProfileRow[]>("people", await supabase.from("profiles").select(PROFILE_COLUMNS).order("name"));
  return rows.map(toUser);
});

export const getUserById = cache(async (id: string | undefined): Promise<User | undefined> => {
  if (!isUuid(id)) return undefined;
  const supabase = await createClient();
  const row = unwrap<ProfileRow | null>(
    "person",
    await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle(),
  );
  return row ? toUser(row) : undefined;
});

/** Display names for these profiles, one query. */
export async function getProfileNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(isUuid))];
  if (!unique.length) return new Map();
  const supabase = await createClient();
  const rows = unwrap<{ id: string; name: string }[]>(
    "people",
    await supabase.from("profiles").select("id, name").in("id", unique),
  );
  return new Map(rows.map((row) => [row.id, row.name]));
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

export interface LabeledReport {
  report: Report;
  groupName: string;
  filerName: string;
}

async function fetchReportRows({
  groupId,
  type,
  period,
  withExpense = false,
  limit,
  labeled = false,
}: ReportQuery & { labeled?: boolean }): Promise<ReportRow[]> {
  const supabase = await createClient();
  let query = supabase.from("reports").select(labeled ? REPORT_LIST_COLUMNS : REPORT_COLUMNS);
  if (groupId) query = query.eq("group_id", idFilter(groupId));
  if (type) query = query.eq("type", type);
  if (withExpense) query = query.eq("type", "fellowship").gt("expense_amount", 0);
  const today = todayISO();
  if (period === "this-month") {
    query = query
      .gte("created_at", startOfLocalDateISO(`${today.slice(0, 7)}-01`))
      .lt("created_at", startOfLocalDateISO(nextMonthISO(today)));
  }
  // Same cutoff as the upcoming loader: local midnight, so a meeting later today still counts.
  // Past and cancelled plans stay in other queries (for example, filed this month).
  if (type === "next-fellowship" || period === "upcoming") {
    query = query
      .eq("type", "next-fellowship")
      .is("cancelled_at", null)
      .gte("report_date", startOfDayTimestamp(today));
  }
  const soonestFirst = type === "next-fellowship" || period === "upcoming";
  let ordered = query.order("report_date", { ascending: soonestFirst }).order("created_at", { ascending: soonestFirst });
  if (limit && limit > 0) ordered = ordered.limit(limit);
  return unwrap<ReportRow[]>("reports", await ordered);
}

const loadReports = cache(
  async (
    groupId: string | undefined,
    type: ReportType | undefined,
    period: ReportQuery["period"],
    withExpense: boolean,
    limit: number | undefined,
  ): Promise<Report[]> => {
    const rows = await fetchReportRows({ groupId, type, period, withExpense, limit });
    return rows.map(toReport);
  },
);

/** Upcoming next-fellowship plans run soonest first. Other reports run newest first. */
export async function getReports({ groupId, type, period, withExpense = false, limit }: ReportQuery = {}): Promise<
  Report[]
> {
  return loadReports(groupId, type, period, withExpense, limit);
}

const loadLabeledReports = cache(
  async (
    groupId: string | undefined,
    type: ReportType | undefined,
    period: ReportQuery["period"],
    withExpense: boolean,
    limit: number | undefined,
  ): Promise<LabeledReport[]> => {
    const rows = await fetchReportRows({ groupId, type, period, withExpense, limit, labeled: true });
    return rows.map((row) => ({
      report: toReport(row),
      groupName: embeddedName(row.groups),
      filerName: embeddedName(row.filer),
    }));
  },
);

/** Reports plus the group and filer names, so a list does not query those again per row. */
export async function getLabeledReports(query: ReportQuery = {}): Promise<LabeledReport[]> {
  return loadLabeledReports(query.groupId, query.type, query.period, query.withExpense ?? false, query.limit);
}

/** Reports created this calendar month, without downloading the rows. */
export async function countReportsCreatedThisMonth(groupId?: string): Promise<number> {
  const supabase = await createClient();
  const today = todayISO();
  let query = supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfLocalDateISO(`${today.slice(0, 7)}-01`))
    .lt("created_at", startOfLocalDateISO(nextMonthISO(today)));
  if (groupId) query = query.eq("group_id", idFilter(groupId));
  const { count, error } = await query;
  if (error) throw new Error(`Could not count reports: ${error.message}`);
  return count ?? 0;
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

export interface UpcomingBrief {
  id: string;
  proposedDate: string;
  time?: string;
  /** Meeting place from `reports.location`. Empty when the plan has none. */
  location: string;
}

/** Soonest upcoming plan for each group, plus the total number of upcoming plans. */
export const getUpcomingBriefs = cache(async (): Promise<{ byGroup: Map<string, UpcomingBrief>; count: number }> => {
  const supabase = await createClient();
  const rows = unwrap<{ id: string; group_id: string; report_date: string; location: string | null }[]>(
    "upcoming fellowships",
    await supabase
      .from("reports")
      .select("id, group_id, report_date, location")
      .eq("type", "next-fellowship")
      .is("cancelled_at", null)
      .gte("report_date", startOfDayTimestamp(todayISO()))
      .order("report_date", { ascending: true })
      .order("created_at", { ascending: true }),
  );
  const byGroup = new Map<string, UpcomingBrief>();
  for (const row of rows) {
    if (byGroup.has(row.group_id)) continue;
    const when = splitReportDateTime(row.report_date);
    byGroup.set(row.group_id, {
      id: row.id,
      proposedDate: when.date,
      time: when.time,
      location: row.location ?? "",
    });
  }
  return { byGroup, count: rows.length };
});

/** The soonest upcoming plan for one group. */
export const getNextFellowship = cache(async (groupId: string): Promise<NextFellowship | undefined> => {
  const supabase = await createClient();
  const row = unwrap<ReportRow | null>(
    "next fellowship",
    await supabase
      .from("reports")
      .select(REPORT_COLUMNS)
      .eq("group_id", idFilter(groupId))
      .eq("type", "next-fellowship")
      .is("cancelled_at", null)
      .gte("report_date", startOfDayTimestamp(todayISO()))
      .order("report_date", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  );
  return row ? (toReport(row) as NextFellowship) : undefined;
});

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
      .eq("is_admin", true)
      .eq("is_superadmin", false),
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
  mobile?: string;
  dateOfBirth?: string;
  email?: string;
  servingSince?: string;
  /** True when they already sign in. The mobile number is then required. */
  hasLogin: boolean;
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
        mobile: string | null;
        date_of_birth: string | null;
        email: string | null;
        serving_since: string | null;
        auth_user_id: string | null;
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
      .select(
        "id, name, mobile, date_of_birth, email, serving_since, auth_user_id, active, is_admin, group_leaders(role, groups(id, name, status))",
      )
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
    mobile: row.mobile ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    email: row.email ?? undefined,
    servingSince: row.serving_since ?? undefined,
    hasLogin: !!row.auth_user_id,
    active: row.active,
    groups,
  };
}

export interface AssistantLeader {
  id: string;
  name: string;
  mobile?: string;
  dateOfBirth?: string;
  email?: string;
  servingSince?: string;
  /** True when they already sign in. The mobile number is then required. */
  hasLogin: boolean;
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
        mobile: string | null;
        date_of_birth: string | null;
        email: string | null;
        serving_since: string | null;
        auth_user_id: string | null;
        active: boolean;
        is_admin: boolean;
      } | null;
      groups: { id: string; name: string; status: GroupStatus } | null;
    }[]
  >(
    "assistant leaders",
    await supabase
      .from("group_leaders")
      .select(
        "profiles(id, name, mobile, date_of_birth, email, serving_since, auth_user_id, active, is_admin), groups(id, name, status)",
      )
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
      mobile: profile.mobile ?? undefined,
      dateOfBirth: profile.date_of_birth ?? undefined,
      email: profile.email ?? undefined,
      servingSince: profile.serving_since ?? undefined,
      hasLogin: !!profile.auth_user_id,
      active: profile.active,
      groups: [groupRef],
    });
  }

  for (const person of byId.values()) {
    person.groups.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
