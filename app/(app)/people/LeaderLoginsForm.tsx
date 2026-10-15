"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { ChoiceField, Field, GROUP_ROLE_OPTIONS, inputClass } from "@/components/form";
import { LeaderDetailFields } from "@/components/LeaderDetailFields";
import { MobileFields } from "@/components/MobileFields";
import { Badge, Button, Card, EmptyState, SectionTitle } from "@/components/ui";
import { loginAsLeader } from "@/lib/actions/auth";
import { addRosterMember, resetLeaderPassword, saveLeaderRecord, type AddMemberState, type IssuedLogin } from "@/lib/actions/people";
import { SUPERADMIN } from "@/lib/config";
import { DEFAULT_COUNTRY_ISO, combineMobile, splitMobile } from "@/lib/countries";
import type { LeaderRosterGroup, LeaderRosterMember } from "@/lib/data-access";
import { useDisplayName } from "@/lib/session";
import { LoginReady } from "../admins/LoginReady";

interface GroupOption {
  id: string;
  name: string;
}

interface PhoneEntry {
  iso: string;
  national: string;
}

interface RosterGroupRef {
  id: string;
  name: string;
  status: LeaderRosterGroup["status"];
}

interface RosterRow {
  id: string;
  storedName: string;
  shownName: string;
  active: boolean;
  hasLogin: boolean;
  groups: RosterGroupRef[];
}

const tableInputClass =
  "block min-h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-1 py-1 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50";

const rosterGrid =
  "grid grid-cols-[minmax(0,1fr)_6.75rem_3.75rem_3.5rem] items-center gap-1";

const SAVE_HINT =
  "Enter a phone number, then update that row. A blank phone is left unchanged. Updating a phone for someone without a login creates one and shows the password once. An existing password stays the same unless you reset it. Change a name and other details from the person's name.";

function emptyPhone(): PhoneEntry {
  return { iso: DEFAULT_COUNTRY_ISO, national: "" };
}

function phonesFromRoster(roster: LeaderRosterGroup[]): Record<string, PhoneEntry> {
  const phones: Record<string, PhoneEntry> = {};
  for (const group of roster) {
    for (const member of group.members) {
      if (phones[member.id] === undefined) {
        phones[member.id] = member.mobile ? splitMobile(member.mobile) : emptyPhone();
      }
    }
  }
  return phones;
}

/** One row per person in this role, sorted by group name. A person in two groups lists both. */
function rowsForRole(
  roster: LeaderRosterGroup[],
  role: LeaderRosterMember["role"],
  shown: (name: string) => string,
): RosterRow[] {
  const byId = new Map<string, RosterRow>();
  for (const group of roster) {
    for (const member of group.members) {
      if (member.role !== role) continue;
      const ref: RosterGroupRef = { id: group.id, name: group.name, status: group.status };
      const existing = byId.get(member.id);
      if (existing) {
        if (!existing.groups.some((item) => item.id === ref.id)) existing.groups.push(ref);
        continue;
      }
      byId.set(member.id, {
        id: member.id,
        storedName: member.name,
        shownName: shown(member.name),
        active: member.active,
        hasLogin: member.hasLogin,
        groups: [ref],
      });
    }
  }
  for (const row of byId.values()) {
    row.groups.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...byId.values()].sort((a, b) => {
    const byGroup = (a.groups[0]?.name ?? "").localeCompare(b.groups[0]?.name ?? "");
    return byGroup || a.shownName.localeCompare(b.shownName);
  });
}

function loginStatus(row: RosterRow): string {
  if (!row.active) return "Deactivated";
  return row.hasLogin ? "Has login" : "No login";
}

export function LeaderLoginsForm({ roster, groups }: { roster: LeaderRosterGroup[]; groups: GroupOption[] }) {
  const [phoneEdits, setPhoneEdits] = useState<Record<string, PhoneEntry>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [issued, setIssued] = useState<Record<string, IssuedLogin>>({});
  const [unchangedIds, setUnchangedIds] = useState<Record<string, boolean>>({});
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [loginAsId, setLoginAsId] = useState<string | null>(null);
  const [pending, startSave] = useTransition();
  const rosterPhones = phonesFromRoster(roster);
  const phones = { ...rosterPhones, ...phoneEdits };

  const shown = useDisplayName();
  const leaderRows = rowsForRole(roster, "leader", shown);
  const assistantRows = rowsForRole(roster, "asst-leader", shown);

  function clearRowFlag(id: string, setter: (value: Record<string, boolean> | ((current: Record<string, boolean>) => Record<string, boolean>)) => void) {
    setter((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function markEdited(id: string) {
    setSavedId((current) => (current === id ? null : current));
    setConfirmResetId((current) => (current === id ? null : current));
    setRowErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
    clearRowFlag(id, setUnchangedIds);
  }

  function setPhone(id: string, national: string) {
    markEdited(id);
    setPhoneEdits((current) => {
      const base = current[id] ?? rosterPhones[id] ?? emptyPhone();
      return { ...current, [id]: { ...base, national } };
    });
  }

  function saveRow(row: RosterRow) {
    if (!row.active || pending) return;
    const name = row.storedName;
    const phone = phones[row.id] ?? emptyPhone();
    const national = phone.national.trim();
    let mobile: string | undefined;
    if (national) {
      const combined = combineMobile(national, phone.iso);
      if (!combined) {
        setRowErrors((current) => ({ ...current, [row.id]: "Enter a valid mobile number, e.g. 9876543210." }));
        return;
      }
      mobile = combined;
    }
    setSavingId(row.id);
    startSave(async () => {
      try {
        const result = await saveLeaderRecord({ profileId: row.id, name, mobile });
        if (result.error) {
          setRowErrors((current) => ({ ...current, [row.id]: result.error ?? "Could not save." }));
          setSavedId((current) => (current === row.id ? null : current));
          clearRowFlag(row.id, setUnchangedIds);
          return;
        }
        setRowErrors((current) => {
          if (!current[row.id]) return current;
          const next = { ...current };
          delete next[row.id];
          return next;
        });
        if (result.login) {
          const login = result.login;
          setIssued((current) => ({ ...current, [row.id]: login }));
          clearRowFlag(row.id, setUnchangedIds);
          setConfirmResetId((current) => (current === row.id ? null : current));
        } else if (result.passwordUnchanged) {
          setUnchangedIds((current) => ({ ...current, [row.id]: true }));
        } else {
          clearRowFlag(row.id, setUnchangedIds);
        }
        setSavedId(row.id);
      } finally {
        setSavingId(null);
      }
    });
  }

  function confirmReset(row: RosterRow) {
    if (!row.active || pending) return;
    setSavingId(row.id);
    startSave(async () => {
      try {
        const result = await resetLeaderPassword(row.id);
        if (result.error || !result.login) {
          setRowErrors((current) => ({ ...current, [row.id]: result.error ?? "Could not reset the password." }));
          return;
        }
        const login = result.login;
        setIssued((current) => ({ ...current, [row.id]: login }));
        clearRowFlag(row.id, setUnchangedIds);
        setSavedId((current) => (current === row.id ? null : current));
        setRowErrors((current) => {
          if (!current[row.id]) return current;
          const next = { ...current };
          delete next[row.id];
          return next;
        });
        setConfirmResetId(null);
      } finally {
        setSavingId(null);
      }
    });
  }

  function dismissLogin(id: string) {
    setIssued((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function loginAs(row: RosterRow) {
    if (!row.active || !row.hasLogin || pending) return;
    setLoginAsId(row.id);
    startSave(async () => {
      try {
        const result = await loginAsLeader(row.id);
        if (result?.error) {
          setRowErrors((current) => ({ ...current, [row.id]: result.error ?? "Could not open that login." }));
        }
      } finally {
        setLoginAsId(null);
      }
    });
  }

  const tableProps = {
    phones,
    rowErrors,
    savedId,
    savingId,
    pending,
    issued,
    unchangedIds,
    confirmResetId,
    loginAsId,
    onPhone: setPhone,
    onSave: saveRow,
    onAskReset: (row: RosterRow) => {
      if (!row.active || pending) return;
      setConfirmResetId(row.id);
    },
    onCancelReset: () => setConfirmResetId(null),
    onConfirmReset: confirmReset,
    onDismissLogin: dismissLogin,
    onLoginAs: loginAs,
  };

  return (
    <div className="px-3 pb-4 pt-2">
      <div className="-mt-6">
        <SectionTitle action={<HintButton text={SAVE_HINT} />}>Leaders</SectionTitle>
      </div>
      {leaderRows.length ? (
        <PeopleTable rows={leaderRows} {...tableProps} />
      ) : (
        <EmptyState title="No leaders yet" description="Add a leader below, then set their name and phone number." />
      )}

      <SectionTitle>Assistant leaders</SectionTitle>
      {assistantRows.length ? (
        <PeopleTable rows={assistantRows} {...tableProps} />
      ) : (
        <p className="px-1 text-sm text-slate-500">No assistant leaders yet.</p>
      )}

      <SectionTitle>Add a leader</SectionTitle>
      {groups.length ? (
        <AddLeaderForm groups={groups} />
      ) : (
        <EmptyState title="No groups yet" description="Add a community group before adding leaders." />
      )}
    </div>
  );
}

function PeopleTable({
  rows,
  phones,
  rowErrors,
  savedId,
  savingId,
  pending,
  issued,
  unchangedIds,
  confirmResetId,
  loginAsId,
  onPhone,
  onSave,
  onAskReset,
  onCancelReset,
  onConfirmReset,
  onDismissLogin,
  onLoginAs,
}: {
  rows: RosterRow[];
  phones: Record<string, PhoneEntry>;
  rowErrors: Record<string, string>;
  savedId: string | null;
  savingId: string | null;
  pending: boolean;
  issued: Record<string, IssuedLogin>;
  unchangedIds: Record<string, boolean>;
  confirmResetId: string | null;
  loginAsId: string | null;
  onPhone: (id: string, national: string) => void;
  onSave: (row: RosterRow) => void;
  onAskReset: (row: RosterRow) => void;
  onCancelReset: () => void;
  onConfirmReset: (row: RosterRow) => void;
  onDismissLogin: (id: string) => void;
  onLoginAs: (row: RosterRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <div className={`${rosterGrid} border-b border-slate-100 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500`}>
        <span className="leading-tight tracking-normal">Name & group</span>
        <span className="leading-tight tracking-normal">Mobile no.</span>
        <span className="sr-only">Update</span>
        <span className="sr-only">Reset password</span>
      </div>
      {rows.map((row) => {
        const phone = phones[row.id] ?? emptyPhone();
        const groupLabel = row.groups.map((group) => group.name).join(", ");
        const status = loginStatus(row);
        const error = rowErrors[row.id];
        const saving = pending && savingId === row.id;
        const login = issued[row.id];
        const confirming = confirmResetId === row.id;
        return (
          <div key={row.id} className={`border-b border-slate-100 last:border-b-0 ${row.active ? "" : "opacity-60"}`}>
            <div className={`${rosterGrid} px-2 py-2`}>
              <div className="min-w-0">
                <Link
                  href={`/people/${row.id}`}
                  title={row.shownName}
                  className="block truncate text-sm font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2"
                >
                  {row.shownName}
                </Link>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium leading-snug text-slate-500">
                  <span className="min-w-0 truncate" title={groupLabel}>
                    {groupLabel}
                  </span>
                  {row.groups.some((group) => group.status === "closed") && <Badge tone="slate">Closed</Badge>}
                </span>
                {SUPERADMIN && row.active && row.hasLogin && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onLoginAs(row)}
                    className="mt-0.5 text-left text-[11px] font-semibold text-brand-700 hover:underline disabled:opacity-50"
                  >
                    {loginAsId === row.id ? "Opening…" : "Login as"}
                  </button>
                )}
                {error ? (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {error}
                  </p>
                ) : (
                  savedId === row.id &&
                  unchangedIds[row.id] && <p className="mt-1 text-xs font-medium text-slate-500">Password unchanged.</p>
                )}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone.national}
                onChange={(e) => onPhone(row.id, e.target.value)}
                disabled={!row.active}
                autoComplete="off"
                aria-label={`Mobile number for ${row.shownName}. ${status}`}
                title={status}
                className={tableInputClass}
              />
              <button
                type="button"
                disabled={!row.active || pending}
                onClick={() => onSave(row)}
                className="inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-white px-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 disabled:opacity-50"
              >
                {saving ? "…" : savedId === row.id ? "Updated" : "Update"}
              </button>
              {row.active && row.hasLogin && !confirming ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onAskReset(row)}
                  className="min-h-9 w-full text-center text-[11px] font-semibold leading-tight text-slate-600 hover:text-brand-700 disabled:opacity-50"
                >
                  Reset
                  <br />
                  password
                </button>
              ) : (
                <span />
              )}
            </div>
            {confirming && (
              <div className="px-2 pb-2">
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200">
                  <p>Replace {row.shownName}&apos;s password? The current one stops working.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onCancelReset}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onConfirmReset(row)}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg bg-amber-700 px-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {saving ? "Resetting…" : "Reset password"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {login && (
              <div className="px-2 pb-2">
                <LoginReady {...login} onDone={() => onDismissLogin(row.id)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HintButton({ text }: { text: string }) {
  const [pinned, setPinned] = useState(false);
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="How updating works"
        aria-expanded={pinned}
        aria-describedby="leader-save-hint"
        onClick={() => setPinned((open) => !open)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <span
        id="leader-save-hint"
        role="tooltip"
        className={`${pinned ? "block" : "hidden group-hover:block"} absolute right-0 top-full z-20 mt-1 w-64 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case tracking-normal text-white shadow-lg`}
      >
        {text}
      </span>
    </span>
  );
}

function AddLeaderForm({ groups }: { groups: GroupOption[] }) {
  const [formKey, setFormKey] = useState(0);
  return <AddLeaderFields key={formKey} groups={groups} onAdded={() => setFormKey((key) => key + 1)} />;
}

function AddLeaderFields({ groups, onAdded }: { groups: GroupOption[]; onAdded: () => void }) {
  const [state, action, pending] = useActionState<AddMemberState, FormData>(addRosterMember, {});

  useEffect(() => {
    if (state.added) onAdded();
  }, [state.added, onAdded]);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <Field label="Name" required>
          <input
            name="name"
            type="text"
            required
            defaultValue={state.values?.name}
            placeholder="e.g. Bro. David"
            autoComplete="off"
            autoCapitalize="words"
            className={inputClass}
          />
        </Field>
        <ChoiceField
          label="Role"
          name="role"
          required
          options={GROUP_ROLE_OPTIONS}
          defaultValue={state.values?.role ?? "leader"}
        />
        <Field label="Group" required>
          <select name="groupId" defaultValue={groups[0]?.id} className={inputClass}>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </Field>
        <MobileFields
          country={state.values?.country}
          mobile={state.values?.mobile}
          hint="Without the country code. Can also be filled in on the tables above."
        />
        <LeaderDetailFields
          dateOfBirth={state.values?.dateOfBirth}
          email={state.values?.email}
          servingSince={state.values?.servingSince}
        />
        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        <Button type="submit" block disabled={pending}>
          {pending ? "Adding…" : "Add to group"}
        </Button>
      </form>
    </Card>
  );
}
