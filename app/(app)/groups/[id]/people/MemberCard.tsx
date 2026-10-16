"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Field, inputClass } from "@/components/form";
import { LeaderDetailFields } from "@/components/LeaderDetailFields";
import { PasswordStrengthMeter } from "@/components/PasswordStrength";
import { MobileFields } from "@/components/MobileFields";
import { Badge, Button, Card, ConfirmCard } from "@/components/ui";
import { loginAsLeader } from "@/lib/actions/auth";
import { type LoginState, type MemberDetailsState, removeMember, setLogin, updateMemberDetails } from "@/lib/actions/people";
import { copyText } from "@/lib/copy-text";
import { DEFAULT_COUNTRY_ISO, splitMobile } from "@/lib/countries";
import type { GroupMember } from "@/lib/data-access";
import { ROLE_LABELS, formatDate } from "@/lib/format";
import { useDisplayName } from "@/lib/session";
import { DEFAULT_PASSWORD, passwordProblem } from "@/lib/passwords";

type Mode = "idle" | "login" | "details" | "remove";

export function MemberCard({
  groupId,
  member,
  canLoginAs = false,
}: {
  groupId: string;
  member: GroupMember;
  canLoginAs?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();
  const [loggingInAs, startLoginAs] = useTransition();
  const shown = useDisplayName();

  return (
    <Card className={member.active ? "" : "opacity-60"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">{shown(member.name)}</p>
          <p className="truncate text-sm text-slate-500">
            {member.hasLogin ? `Signs in with ${member.mobile}` : "No login yet"}
            {!member.active && " · Deactivated"}
          </p>
          <MemberDetails member={member} />
        </div>
        <Badge>{ROLE_LABELS[member.role]}</Badge>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {mode === "login" && <LoginForm member={member} onDone={() => setMode("idle")} />}
      {mode === "details" && <DetailsForm member={member} onDone={() => setMode("idle")} />}

      {mode === "remove" && (
        <div className="mt-3">
          <ConfirmCard
            title={`Remove ${shown(member.name)} from this group?`}
            description="Their past reports are kept. Their login stays, but they won't see this group any more."
            confirmLabel={removing ? "Removing…" : "Remove"}
            onBack={() => setMode("idle")}
            onConfirm={() =>
              startRemove(async () => {
                const result = await removeMember(groupId, member.id);
                if (result.error) setError(result.error);
                setMode("idle");
              })
            }
          />
        </div>
      )}

      {mode === "idle" && (
        <div className="mt-3 space-y-2">
          {canLoginAs && member.active && member.hasLogin && (
            <Button
              variant="secondary"
              block
              disabled={loggingInAs}
              onClick={() =>
                startLoginAs(async () => {
                  const result = await loginAsLeader(member.id);
                  if (result?.error) setError(result.error);
                })
              }
            >
              {loggingInAs ? "Opening…" : "Login as"}
            </Button>
          )}
          <Button variant="secondary" block onClick={() => setMode("details")}>
            Edit details
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setMode("login")}>
              {member.hasLogin ? "Reset password" : "Set up login"}
            </Button>
            <Button variant="danger" onClick={() => setMode("remove")}>
              Remove
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function MemberDetails({ member }: { member: GroupMember }) {
  if (!member.dateOfBirth && !member.email && !member.servingSince) return null;

  return (
    <dl className="mt-2 space-y-0.5 text-sm text-slate-600">
      {member.dateOfBirth && (
        <div>
          <dt className="inline text-slate-500">Date of birth </dt>
          <dd className="inline">{formatDate(member.dateOfBirth)}</dd>
        </div>
      )}
      {member.email && (
        <div>
          <dt className="inline text-slate-500">Email </dt>
          <dd className="inline break-all">{member.email}</dd>
        </div>
      )}
      {member.servingSince && (
        <div>
          <dt className="inline text-slate-500">Started serving </dt>
          <dd className="inline">{formatDate(member.servingSince)}</dd>
        </div>
      )}
    </dl>
  );
}

function DetailsForm({ member, onDone }: { member: GroupMember; onDone: () => void }) {
  const [state, action, pending] = useActionState<MemberDetailsState, FormData>(
    updateMemberDetails.bind(null, member.id),
    {},
  );

  useEffect(() => {
    if (state.saved) onDone();
  }, [state.saved, onDone]);

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <LeaderDetailFields
        dateOfBirth={state.values?.dateOfBirth ?? member.dateOfBirth}
        email={state.values?.email ?? member.email}
        servingSince={state.values?.servingSince ?? member.servingSince}
      />
      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onDone}>
          Back
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </form>
  );
}

function LoginForm({ member, onDone }: { member: GroupMember; onDone: () => void }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(setLogin.bind(null, member.id), {});
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const stored = member.mobile ? splitMobile(member.mobile) : { iso: DEFAULT_COUNTRY_ISO, national: "" };

  if (state.saved?.mobile) return <LoginReady {...state.saved} mobile={state.saved.mobile} onDone={onDone} />;

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <MobileFields
        required
        country={state.values?.country ?? stored.iso}
        mobile={state.values?.mobile ?? stored.national}
        hint="Without the country code."
      />
      <Field label="Password" required aside="Share it with them privately.">
        <input
          name="password"
          type="text"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          className={inputClass}
        />
        <PasswordStrengthMeter password={password} />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onDone}>
          Back
        </Button>
        <Button type="submit" disabled={pending || passwordProblem(password) !== null}>
          {pending ? "Saving…" : "Save login"}
        </Button>
      </div>
    </form>
  );
}

function LoginReady({
  name,
  mobile,
  password,
  onDone,
}: {
  name: string;
  mobile: string;
  password: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const shown = useDisplayName();
  const shownMobile = splitMobile(mobile).national;
  const message = `Your SFC Community Groups login\n${window.location.origin}\nMobile: ${shownMobile}\nPassword: ${password}`;

  return (
    <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
      <p className="font-bold">Login ready for {shown(name)}</p>
      <p className="mt-1">
        Mobile: <span className="font-semibold">{shownMobile}</span>
        <br />
        Password: <span className="font-semibold">{password}</span>
      </p>
      <p className="mt-1 text-xs text-emerald-700">The password isn&apos;t shown again, so send it now.</p>
      {copyFailed && <p className="mt-1 text-xs font-medium text-red-700">Could not copy. Select the details above.</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            void copyText(message).then((ok) => {
              setCopied(ok);
              setCopyFailed(!ok);
            });
          }}
        >
          {copied ? "Copied" : "Copy details"}
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
