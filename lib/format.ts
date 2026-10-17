import type { ContactMode, Frequency, ReportType, Role } from "@/data/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

/** "17:30" or "17:30:00" -> "5:30 PM". */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Date, with the time appended when one was recorded. */
export function formatDateTime(iso: string, time?: string): string {
  return time ? `${formatDate(iso)}, ${formatTime(time)}` : formatDate(iso);
}

/** Short date, with the time appended when one was recorded. */
export function formatShortDateTime(iso: string, time?: string): string {
  return time ? `${formatShortDate(iso)}, ${formatTime(time)}` : formatShortDate(iso);
}

/** Short date, time when recorded, then the weekday: "31 Oct, 5:00 PM, Sat". */
export function formatShortDateTimeDay(iso: string, time?: string): string {
  const day = WEEKDAYS[parseLocalDate(iso).getDay()];
  return `${formatShortDateTime(iso, time)}, ${day}`;
}

/** "HH:MM:SS" from the database as the "HH:MM" a time input expects. */
export function timeInputValue(time?: string): string {
  return time ? time.slice(0, 5) : "";
}

/** True when the clock time is on the hour or half hour. */
export function isHalfHourTime(time: string): boolean {
  return /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(time.slice(0, 5));
}

/** Every :00 and :30 slot in a day, as "HH:MM". */
export const HALF_HOUR_TIMES: string[] = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

/** Calendar date plus optional "HH:MM" as a timestamp without timezone. Midnight when time is absent. */
export function combineDateAndTime(date: string, time?: string): string {
  const match = time?.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  const clock = match ? `${match[1]}:${match[2]}:${match[3] ?? "00"}` : "00:00:00";
  return `${date.slice(0, 10)}T${clock}`;
}

/** Inclusive start of a local calendar day, e.g. "2026-10-14T00:00:00". */
export function startOfDayTimestamp(iso: string): string {
  return `${iso.slice(0, 10)}T00:00:00`;
}

/** Exclusive end of a local calendar day: midnight at the start of the next day. */
export function startOfNextDayTimestamp(iso: string): string {
  return `${addDaysISO(iso.slice(0, 10), 1)}T00:00:00`;
}

/**
 * Splits a stored report timestamp into a calendar date and an optional clock time.
 * Midnight means no time was recorded (older rows and follow-ups).
 */
export function splitReportDateTime(value: string): { date: string; time?: string } {
  const date = value.slice(0, 10);
  const match = value.slice(10).match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return { date };
  const time = `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
  return time === "00:00:00" ? { date } : { date, time };
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

/** Kept so the old 7-day backdate limit can be restored. Not enforced for now. */
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
  superadmin: "Admin",
  admin: "Admin",
  leader: "Leader",
  "asst-leader": "Asst. Leader",
};

export const CONTACT_MODES: { value: ContactMode; label: string; emoji: string }[] = [
  { value: "call", label: "Call", emoji: "📞" },
  { value: "text", label: "Text/Whatsapp", emoji: "💬" },
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

const SALUTATION = /^(?:(?:bro|sis|dr|mr|mrs|ms|miss|pr|ps|rev|pastor|elder)\.?\s+)+/i;

/** Name as shown on screen; drops a leading title unless `show` is on. */
export function displayName(name: string, show: boolean): string {
  if (show) return name;
  return name.replace(SALUTATION, "") || name;
}

export const NOT_ASSIGNED = "Not assigned";
export const NOT_AVAILABLE = "Not available";
