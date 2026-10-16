import "server-only";

import { after } from "next/server";
import { getCurrentUser, getRealUser } from "@/lib/auth";
import { SUPERADMIN } from "@/lib/config";
import { getLoginAsProfileId } from "@/lib/login-as";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityFeature = "auth" | "reports" | "groups" | "people" | "admins";
export type ActivityOutcome = "success" | "error";

export interface ActivityEntry {
  feature: ActivityFeature;
  action: string;
  outcome: ActivityOutcome;
  summary: string;
  errorMessage?: string | null;
  /** When omitted, resolved from the current session inside `after()`. Pass `null` for anonymous (e.g. failed sign-in). */
  actorId?: string | null;
  actorRole?: string | null;
  actingAsId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

function clip(text: string | null | undefined, max = 300): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Records one activity row when SUPERADMIN is on. Schedules the insert with
 * `after()` so the user-facing action is not delayed. No-op when the flag is off.
 */
export function recordActivity(entry: ActivityEntry): void {
  if (!SUPERADMIN) return;

  const summary = clip(entry.summary) ?? entry.action;
  const errorMessage = entry.outcome === "error" ? clip(entry.errorMessage) : null;
  const hasActor = Object.prototype.hasOwnProperty.call(entry, "actorId");

  after(async () => {
    try {
      let actorId = hasActor ? (entry.actorId ?? null) : undefined;
      let actorRole = entry.actorRole ?? null;
      let actingAsId = entry.actingAsId ?? null;

      if (actorId === undefined) {
        const [real, effective, loginAsId] = await Promise.all([
          getRealUser(),
          getCurrentUser(),
          getLoginAsProfileId(),
        ]);
        actorId = real?.id ?? null;
        actorRole = effective?.role ?? real?.role ?? null;
        actingAsId = real && loginAsId && real.id !== loginAsId ? loginAsId : null;
      }

      await createAdminClient().from("activity_log").insert({
        feature: entry.feature,
        action: entry.action,
        outcome: entry.outcome,
        actor_id: actorId ?? null,
        actor_role: actorRole,
        acting_as_id: actingAsId,
        entity_type: entry.entityType ?? null,
        entity_id: entry.entityId ?? null,
        summary,
        error_message: errorMessage,
      });
    } catch {
      // Logging must never affect the app.
    }
  });
}

export function recordSuccess(
  entry: Omit<ActivityEntry, "outcome" | "errorMessage"> & { errorMessage?: undefined },
): void {
  recordActivity({ ...entry, outcome: "success" });
}

export function recordError(
  entry: Omit<ActivityEntry, "outcome"> & { errorMessage: string },
): void {
  recordActivity({ ...entry, outcome: "error", errorMessage: entry.errorMessage });
}

export interface ActivityRow {
  id: string;
  createdAt: string;
  feature: string;
  action: string;
  outcome: ActivityOutcome;
  summary: string;
  errorMessage: string | null;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  actingAsId: string | null;
  actingAsName: string | null;
}

export interface ActivityUsageCount {
  feature: string;
  role: string;
  successes: number;
  errors: number;
}

const FEATURE_LABELS: Record<string, string> = {
  auth: "Sign-in & account",
  reports: "Reports",
  groups: "Groups",
  people: "Leaders & logins",
  admins: "Admins",
};

export function featureLabel(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature;
}

/** Last 7 days of usage counts — call only from the SUPERADMIN activity page. */
export async function getActivityUsage(days = 7): Promise<ActivityUsageCount[]> {
  if (!SUPERADMIN) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createAdminClient()
    .from("activity_log")
    .select("feature, actor_role, outcome")
    .gte("created_at", since);
  if (error || !data) return [];

  const counts = new Map<string, ActivityUsageCount>();
  for (const row of data) {
    const role = row.actor_role || "unknown";
    const key = `${row.feature}|${role}`;
    const current = counts.get(key) ?? { feature: row.feature, role, successes: 0, errors: 0 };
    if (row.outcome === "error") current.errors += 1;
    else current.successes += 1;
    counts.set(key, current);
  }
  return [...counts.values()].sort((a, b) => {
    const byFeature = a.feature.localeCompare(b.feature);
    return byFeature || a.role.localeCompare(b.role);
  });
}

async function mapActivityRows(
  rows: {
    id: string;
    created_at: string;
    feature: string;
    action: string;
    outcome: string;
    summary: string;
    error_message: string | null;
    actor_id: string | null;
    actor_role: string | null;
    acting_as_id: string | null;
  }[],
): Promise<ActivityRow[]> {
  const ids = [
    ...new Set(rows.flatMap((row) => [row.actor_id, row.acting_as_id].filter((id): id is string => !!id))),
  ];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data } = await createAdminClient().from("profiles").select("id, name").in("id", ids);
    for (const person of data ?? []) names.set(person.id, person.name);
  }
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    feature: row.feature,
    action: row.action,
    outcome: row.outcome === "error" ? "error" : "success",
    summary: row.summary,
    errorMessage: row.error_message,
    actorId: row.actor_id,
    actorName: row.actor_id ? (names.get(row.actor_id) ?? null) : null,
    actorRole: row.actor_role,
    actingAsId: row.acting_as_id,
    actingAsName: row.acting_as_id ? (names.get(row.acting_as_id) ?? null) : null,
  }));
}

/** Newest activity rows — call only from the SUPERADMIN activity page. */
export async function getRecentActivity(limit = 100): Promise<ActivityRow[]> {
  if (!SUPERADMIN) return [];
  const { data, error } = await createAdminClient()
    .from("activity_log")
    .select(
      "id, created_at, feature, action, outcome, summary, error_message, actor_id, actor_role, acting_as_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return mapActivityRows(data);
}

/** Newest error rows — call only from the SUPERADMIN activity page. */
export async function getRecentActivityErrors(limit = 20): Promise<ActivityRow[]> {
  if (!SUPERADMIN) return [];
  const { data, error } = await createAdminClient()
    .from("activity_log")
    .select(
      "id, created_at, feature, action, outcome, summary, error_message, actor_id, actor_role, acting_as_id",
    )
    .eq("outcome", "error")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return mapActivityRows(data);
}
