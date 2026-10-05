import type { ReactNode } from "react";
import type { CommunityGroup, Role, User } from "@/data/types";
import { ROLE_LABELS, formatDate, todayISO } from "@/lib/format";
import { Badge, Button, Card } from "./ui";

export const LEADER_ROLES: Role[] = ["leader", "asst-leader"];

export const inputClass =
  "block w-full min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 text-base font-bold text-slate-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function Field({
  label,
  optional,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {optional && <span className="font-normal text-slate-400"> (optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/** Read-only "Report Filed By" block; the group and user always come from the session. */
export function FiledBy({ user, group }: { user: User; group: CommunityGroup }) {
  return (
    <Card className="bg-slate-50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Report Filed By</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold">{user.name}</span>
        <Badge>{ROLE_LABELS[user.role]}</Badge>
      </div>
      <p className="mt-0.5 text-sm text-slate-500">
        {group.name} · {formatDate(todayISO())}
      </p>
    </Card>
  );
}

export function SubmitBar({ label, error }: { label: string; error?: string | null }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-slate-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      {error && (
        <p role="alert" className="mb-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block>
        {label}
      </Button>
    </div>
  );
}
