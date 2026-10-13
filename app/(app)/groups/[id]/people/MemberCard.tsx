"use client";

import { useActionState, useState, useTransition } from "react";
import { Field, inputClass } from "@/components/form";
import { Badge, Button, Card, ConfirmCard } from "@/components/ui";
import { type LoginState, removeMember, setLogin } from "@/lib/actions/people";
import type { GroupMember } from "@/lib/data-access";
import { ROLE_LABELS } from "@/lib/format";
import { MIN_PASSWORD_LENGTH, generatePassword } from "@/lib/passwords";

type Mode = "idle" | "login" | "remove";

export function MemberCard({ groupId, member }: { groupId: string; member: GroupMember }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();

  return (
    <Card className={member.active ? "" : "opacity-60"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">{member.name}</p>
          <p className="truncate text-sm text-slate-500">
            {member.hasLogin ? `Signs in with ${member.mobile}` : "No login yet"}
            {!member.active && " · Deactivated"}
          </p>
        </div>
        <Badge>{ROLE_LABELS[member.role]}</Badge>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {mode === "login" && <LoginForm member={member} onDone={() => setMode("idle")} />}

      {mode === "remove" && (
        <div className="mt-3">
          <ConfirmCard
            title={`Remove ${member.name} from this group?`}
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setMode("login")}>
            {member.hasLogin ? "Reset password" : "Set up login"}
          </Button>
          <Button variant="danger" onClick={() => setMode("remove")}>
            Remove
          </Button>
        </div>
      )}
    </Card>
  );
}

function LoginForm({ member, onDone }: { member: GroupMember; onDone: () => void }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(setLogin.bind(null, member.id), {});
  const [password, setPassword] = useState(generatePassword);

  if (state.saved) return <LoginReady {...state.saved} onDone={onDone} />;

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <Field label="Mobile number">
        <input
          name="mobile"
          type="tel"
          inputMode="tel"
          required
          defaultValue={member.mobile}
          placeholder="e.g. 9876543210"
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      <Field label="Password" hint={`At least ${MIN_PASSWORD_LENGTH} characters. Share it with them privately.`}>
        <div className="flex gap-2">
          <input
            name="password"
            type="text"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
          <Button variant="secondary" className="shrink-0" onClick={() => setPassword(generatePassword())}>
            New
          </Button>
        </div>
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
        <Button type="submit" disabled={pending}>
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
  const message = `Your SFC Community Groups login\n${window.location.origin}\nMobile: ${mobile}\nPassword: ${password}`;

  return (
    <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
      <p className="font-bold">Login ready for {name}</p>
      <p className="mt-1">
        Mobile: <span className="font-semibold">{mobile}</span>
        <br />
        Password: <span className="font-semibold">{password}</span>
      </p>
      <p className="mt-1 text-xs text-emerald-700">The password isn&apos;t shown again, so send it now.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(message);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy details"}
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
