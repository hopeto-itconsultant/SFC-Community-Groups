import { PageHeader } from "@/components/PageHeader";
import { NotAvailable } from "@/components/RoleGate";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import {
  featureLabel,
  getActivityUsage,
  getRecentActivity,
  getRecentActivityErrors,
  type ActivityRow,
  type ActivityUsageCount,
} from "@/lib/activity-log";
import { getRealUser } from "@/lib/auth";
import { ROLE_LABELS, displayName } from "@/lib/format";
import { getHiddenSalutations } from "@/lib/hidden-salutations";
import { isSuperAdmin } from "@/lib/roles";
import type { Role } from "@/data/types";

export default async function ActivityPage() {
  const real = await getRealUser();
  if (!real || !isSuperAdmin(real.role)) {
    return <NotAvailable message="Only a superadmin can view the activity log." />;
  }

  const [usage, errors, recent, salutations] = await Promise.all([
    getActivityUsage(7),
    getRecentActivityErrors(20),
    getRecentActivity(100),
    getHiddenSalutations(),
  ]);

  return (
    <>
      <PageHeader title="Activity log" backHref="/settings" />
      <div className="space-y-1 p-4 pb-6 @md:grid @md:grid-cols-2 @md:items-start @md:gap-4 @md:space-y-0">
        <UsageSection usage={usage} />
        <div className="space-y-1">
          <ErrorsSection errors={errors} showSalutations={real.showSalutations} salutations={salutations} />
          <RecentSection rows={recent} showSalutations={real.showSalutations} salutations={salutations} />
        </div>
      </div>
    </>
  );
}

function UsageSection({ usage }: { usage: ActivityUsageCount[] }) {
  const byFeature = new Map<string, { successes: number; errors: number }>();
  for (const row of usage) {
    const current = byFeature.get(row.feature) ?? { successes: 0, errors: 0 };
    current.successes += row.successes;
    current.errors += row.errors;
    byFeature.set(row.feature, current);
  }
  const features = [...byFeature.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <>
      <SectionTitle className="mb-2 mt-0">Last 7 days</SectionTitle>
      {features.length === 0 ? (
        <EmptyState title="No activity yet" description="Feature use will show here once people start using the app." />
      ) : (
        <Card className="space-y-3">
          {features.map(([feature, counts]) => (
            <div key={feature} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-900">{featureLabel(feature)}</span>
              <span className="shrink-0 text-slate-600">
                {counts.successes} ok
                {counts.errors > 0 ? ` · ${counts.errors} error${counts.errors === 1 ? "" : "s"}` : ""}
              </span>
            </div>
          ))}
          {usage.some((row) => row.role && row.role !== "unknown") && (
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By role</p>
              <div className="space-y-1.5">
                {usage.map((row) => (
                  <div key={`${row.feature}-${row.role}`} className="flex justify-between gap-2 text-xs text-slate-600">
                    <span>
                      {featureLabel(row.feature)} · {roleLabel(row.role)}
                    </span>
                    <span className="shrink-0">
                      {row.successes + row.errors}
                      {row.errors > 0 ? ` (${row.errors} err)` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}

function ErrorsSection({
  errors,
  showSalutations,
  salutations,
}: {
  errors: ActivityRow[];
  showSalutations: boolean;
  salutations: readonly string[];
}) {
  return (
    <>
      <SectionTitle>Recent errors</SectionTitle>
      {errors.length === 0 ? (
        <p className="px-1 text-sm text-slate-500">No errors recorded recently.</p>
      ) : (
        <div className="space-y-2">
          {errors.map((row) => (
            <ActivityCard
              key={row.id}
              row={row}
              showSalutations={showSalutations}
              salutations={salutations}
              emphasizeError
            />
          ))}
        </div>
      )}
    </>
  );
}

function RecentSection({
  rows,
  showSalutations,
  salutations,
}: {
  rows: ActivityRow[];
  showSalutations: boolean;
  salutations: readonly string[];
}) {
  return (
    <>
      <SectionTitle>Recent activity</SectionTitle>
      {rows.length === 0 ? (
        <EmptyState title="Nothing logged yet" description="Successful actions and errors will appear here." />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <ActivityCard key={row.id} row={row} showSalutations={showSalutations} salutations={salutations} />
          ))}
        </div>
      )}
    </>
  );
}

function ActivityCard({
  row,
  showSalutations,
  salutations,
  emphasizeError,
}: {
  row: ActivityRow;
  showSalutations: boolean;
  salutations: readonly string[];
  emphasizeError?: boolean;
}) {
  const who = actorLine(row, showSalutations, salutations);
  return (
    <Card className={row.outcome === "error" || emphasizeError ? "ring-red-200/80" : ""}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-semibold text-slate-900">{row.summary}</p>
        <Badge tone={row.outcome === "error" ? "red" : "slate"}>
          {row.outcome === "error" ? "Error" : "Ok"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {featureLabel(row.feature)} · {formatWhen(row.createdAt)}
        {who ? ` · ${who}` : ""}
      </p>
      {row.outcome === "error" && row.errorMessage && (
        <p className="mt-2 text-sm text-red-700">{row.errorMessage}</p>
      )}
    </Card>
  );
}

function actorLine(row: ActivityRow, showSalutations: boolean, salutations: readonly string[]): string | null {
  if (!row.actorName && !row.actingAsName) return null;
  const actor = row.actorName ? displayName(row.actorName, showSalutations, salutations) : "Someone";
  const role = row.actorRole ? ` (${roleLabel(row.actorRole)})` : "";
  if (row.actingAsName) {
    return `${actor}${role} as ${displayName(row.actingAsName, showSalutations, salutations)}`;
  }
  return `${actor}${role}`;
}

function roleLabel(role: string): string {
  if (role in ROLE_LABELS) return ROLE_LABELS[role as Role];
  return role;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
}
