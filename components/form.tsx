import type { ReactNode } from "react";
import type { CommunityGroup, CurrentUser, Role } from "@/data/types";
import { ROLE_LABELS, displayName, formatDate, todayISO } from "@/lib/format";
import { Badge, Button, Card } from "./ui";

export const LEADER_ROLES: Exclude<Role, "admin" | "superadmin">[] = ["leader", "asst-leader"];

/** Leader or assistant leader, chosen with one tap. */
export const GROUP_ROLE_OPTIONS = LEADER_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export const inputClass =
  "block w-full min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

/** Fills its grid cell. The browser's default min-width would otherwise ignore the column. */
export const dateTimeControlClass = `${inputClass} !min-w-0`;

function RequiredMark() {
  return (
    <span className="text-red-600" aria-hidden="true">
      {" *"}
    </span>
  );
}

export function FormSection({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <h2 className="mb-3 text-base font-bold text-slate-900">
        {title}
        {required && <RequiredMark />}
      </h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function Field({
  label,
  required,
  hint,
  aside,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  /** Read-only note on the label row, to the right of the field name. */
  aside?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-start justify-between gap-3">
        <span className="shrink-0 text-sm font-semibold text-slate-700">
          {label}
          {required && <RequiredMark />}
        </span>
        {aside && <span className="min-w-0 text-right text-xs font-medium leading-snug text-slate-500">{aside}</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/**
 * One tap picks an option. Use this for a short fixed list (about 2–4 choices).
 * A dropdown takes a second tap to open.
 */
export function ChoiceField({
  label,
  name,
  required,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  const columns = options.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-slate-700">
        {label}
        {required && <RequiredMark />}
      </legend>
      <div className={`grid gap-2 ${columns}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-12 cursor-pointer touch-manipulation items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              required={required && option.value === options[0]?.value}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Date and time pickers on one row: date gets 3/5 of the width, time the other 2/5. */
export function DateTimeField({
  label,
  hint,
  aside,
  date,
  time,
}: {
  label: string;
  hint?: string;
  /** Note or control on the label row, to the right of the field name. */
  aside?: ReactNode;
  date: ReactNode;
  time: ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 flex items-start justify-between gap-3">
        <span className="shrink-0 text-sm font-semibold text-slate-700">
          {label}
          <RequiredMark />
        </span>
        {aside && <span className="min-w-0 text-right text-xs font-medium leading-snug text-slate-500">{aside}</span>}
      </span>
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-3 min-w-0">{date}</div>
        <div className="col-span-2 min-w-0">{time}</div>
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

/** Read-only "Report Filed By" block; the group and user always come from the session. */
export function FiledBy({
  user,
  group,
  compact = false,
}: {
  user: CurrentUser;
  group: CommunityGroup;
  /** One line: name, role, and date. The group is left off when the page header already shows it. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p className="truncate text-sm text-slate-500">
        <span className="font-semibold text-slate-700">Filed by</span>{" "}
        <span className="font-semibold text-slate-900">{displayName(user.name, user.showSalutations)}</span>
        <span className="text-xs font-medium">
          {" "}
          · {ROLE_LABELS[user.role]} · {formatDate(todayISO())}
        </span>
      </p>
    );
  }

  return (
    <Card className="bg-slate-50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Report Filed By</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold">{displayName(user.name, user.showSalutations)}</span>
        <Badge>{ROLE_LABELS[user.role]}</Badge>
      </div>
      <p className="mt-0.5 text-sm text-slate-500">
        {group.name} · {formatDate(todayISO())}
      </p>
    </Card>
  );
}

export function SubmitBar({
  label,
  error,
  pending = false,
}: {
  label: string;
  error?: string | null;
  pending?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-slate-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      {error && (
        <p role="alert" className="mb-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "SAVING…" : label}
      </Button>
    </div>
  );
}
