import { cache } from "react";
import type { ContactMode, Frequency, ReportType, Role } from "@/data/types";

declare global {
  interface Window {
    /** Calendar day this response was rendered with. Set before hydration so dates match. */
    __SFC_TODAY__?: string;
  }
}

/** One clock per server request, so every "today" on the page is the same string. */
const requestNowMs = cache(() => Date.now());

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

export function todayISO(): string {
  if (typeof window !== "undefined" && window.__SFC_TODAY__) return window.__SFC_TODAY__;
  const now = new Date(typeof window === "undefined" ? requestNowMs() : Date.now());
  return toISODate(now);
}

/** How far back a fellowship report can be dated. */
export const REPORT_BACKDATE_DAYS = 7;

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Calendar date `days` days before today. */
export function daysAgoISO(days: number): string {
  return shiftISO(todayISO(), -days);
}

/** Calendar date of this coming Sunday (today if it is Sunday). */
export function endOfWeekISO(): string {
  const today = todayISO();
  const [y, m, d] = today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return shiftISO(today, (7 - dow) % 7);
}

/** Local date-time without timezone, e.g. "2026-10-05T17:30:00". */
export function nowLocalISO(): string {
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return `${toISODate(now)}T${time}`;
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
