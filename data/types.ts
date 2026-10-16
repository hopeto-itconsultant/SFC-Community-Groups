export type Role = "superadmin" | "admin" | "leader" | "asst-leader";

export type Frequency = "monthly" | "every-2-months";

export type ContactMode = "call" | "text" | "in-person";

export type ReportType = "fellowship" | "follow-up" | "next-fellowship";

export type GroupStatus = "active" | "closed";

export interface Person {
  id: string;
  name: string;
}

export interface User extends Person {
  role: Role;
  /** Required for leaders and asst. leaders, absent for admins. */
  groupId?: string;
}

/** The signed-in person, with their own display preferences. */
export interface CurrentUser extends User {
  /** Show titles such as "Bro." before names on this person's screens. */
  showSalutations: boolean;
}

export interface CommunityGroup {
  id: string;
  name: string;
  category?: string;
  /** Informational only; may be missing. */
  frequency?: Frequency;
  leaderIds: string[];
  assistantLeaderIds: string[];
  /** Image URL, e.g. "/photos/group-photos/<group id>/<file>". */
  photo?: string;
  /** Closed groups are kept, with their reports, instead of being deleted. Missing means active. */
  status?: GroupStatus;
  /** ISO date the group was closed. */
  closedAt?: string;
}

interface ReportBase {
  id: string;
  groupId: string;
  /** User id of the person who filed the report. */
  filedBy: string;
  /** ISO date-time the report was filed. */
  createdAt: string;
}

export interface FellowshipReport extends ReportBase {
  type: "fellowship";
  /** ISO date (YYYY-MM-DD) of the fellowship. */
  date: string;
  /** Wall-clock start time "HH:MM:SS". Absent when none was recorded. */
  time?: string;
  location: string;
  attendees: number;
  firstTimers: number;
  summary: string;
  comments: string;
  expenseAmount?: number;
  expenseDetails?: string;
  /** Image URLs. */
  photos: string[];
}

export interface FollowUpReport extends ReportBase {
  type: "follow-up";
  /** ISO date (YYYY-MM-DD) of the follow-up. */
  date: string;
  personName: string;
  mode: ContactMode;
  comments: string;
}

export interface NextFellowship extends ReportBase {
  type: "next-fellowship";
  /** ISO date (YYYY-MM-DD). */
  proposedDate: string;
  /** Wall-clock start time "HH:MM:SS". Absent when none was recorded. */
  time?: string;
  location: string;
  activity: string;
  goals: string;
  /** ISO date-time the plan was cancelled; cancelled plans are kept but no longer upcoming. */
  cancelledAt?: string;
}

export type Report = FellowshipReport | FollowUpReport | NextFellowship;
