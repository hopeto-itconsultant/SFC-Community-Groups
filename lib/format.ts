import type { ContactMode, Frequency, ReportType, Role } from "@/data/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parses "YYYY-MM-DD" (or an ISO date-time) as a local calendar date. */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-09-28" -> "28 Sep 2026" */
export function formatDate(iso: string): string {
  const date = parseLocalDate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2026-09-28" -> "28 Sep" */
export function formatShortDate(iso: string): string {
  const date = parseLocalDate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The church is in India: "today", "this week" and "this month" follow this zone, also on UTC servers. */
export const APP_TIME_ZONE = "Asia/Kolkata";

/** Asia/Kolkata has no daylight saving time. */
const APP_UTC_OFFSET = "+05:30";

const appDateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Calendar date and wall-clock time in APP_TIME_ZONE, e.g. ["2026-10-05", "17:30:00"]. */
function appDateTime(date: Date): [string, string] {
  const p = Object.fromEntries(appDateTimeFormat.formatToParts(date).map((part) => [part.type, part.value]));
  return [`${p.year}-${p.month}-${p.day}`, `${p.hour}:${p.minute}:${p.second}`];
}

/** "2026-10-05" plus `days` calendar days. */
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function todayISO(): string {
  return appDateTime(new Date())[0];
}

/** How far back a fellowship report can be dated. */
export const REPORT_BACKDATE_DAYS = 7;

/** Local calendar date `days` days before today. */
export function daysAgoISO(days: number): string {
  return addDaysISO(todayISO(), -days);
}

/** Local calendar date of this coming Sunday (today if it is Sunday). */
export function endOfWeekISO(): string {
  const today = todayISO();
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDaysISO(today, (7 - weekday) % 7);
}

/** Local date-time without timezone, e.g. "2026-10-05T17:30:00". */
export function nowLocalISO(): string {
  const [date, time] = appDateTime(new Date());
  return `${date}T${time}`;
}

/** A database timestamp as local date-time with offset, e.g. "2026-10-05T17:30:00+05:30". */
export function toLocalDateTimeISO(timestamp: string): string {
  const [date, time] = appDateTime(new Date(timestamp));
  return `${date}T${time}${APP_UTC_OFFSET}`;
}

/** Start of a local calendar date as a timestamp, e.g. "2026-10-01T00:00:00+05:30". */
export function startOfLocalDateISO(iso: string): string {
  return `${iso.slice(0, 10)}T00:00:00${APP_UTC_OFFSET}`;
}

/** First day of the month after the one containing `iso`, e.g. "2026-10-05" -> "2026-11-01". */
export function nextMonthISO(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRupees(amount: number): string {
  return rupee.format(amount);
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  monthly: "Monthly",
  "every-2-months": "Every 2 months",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  leader: "Leader",
  "asst-leader": "Asst. Leader",
};

export const CONTACT_MODES: { value: ContactMode; label: string; emoji: string }[] = [
  { value: "call", label: "Call", emoji: "📞" },
  { value: "text", label: "Text", emoji: "💬" },
  { value: "in-person", label: "In Person", emoji: "🤝" },
];

export function contactModeLabel(mode: ContactMode): string {
  const m = CONTACT_MODES.find((c) => c.value === mode);
  return m ? `${m.emoji} ${m.label}` : mode;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  fellowship: "Fellowship Report",
  "follow-up": "Follow-up Report",
  "next-fellowship": "Next Fellowship",
};

export const REPORT_TYPE_EMOJI: Record<ReportType, string> = {
  fellowship: "📝",
  "follow-up": "📞",
  "next-fellowship": "📅",
};

export const NOT_ASSIGNED = "Not assigned";
export const NOT_AVAILABLE = "Not available";
