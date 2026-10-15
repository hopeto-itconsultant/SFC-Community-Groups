"use client";

import { useActionState, useState, useTransition } from "react";
import { Field, inputClass } from "@/components/form";
import { MobileFields } from "@/components/MobileFields";
import { PasswordStrengthMeter } from "@/components/PasswordStrength";
import { Badge, Button, Card, ConfirmCard } from "@/components/ui";
import { setAdminActive, setLogin, type LoginState } from "@/lib/actions/people";
import { DEFAULT_COUNTRY_ISO, splitMobile } from "@/lib/countries";
import type { AdminAccount } from "@/lib/data-access";
import { useDisplayName } from "@/lib/session";
import { DEFAULT_PASSWORD, passwordProblem } from "@/lib/passwords";
import { LoginReady } from "./LoginReady";

type Mode = "idle" | "login" | "deactivate";

export function AdminCard({ admin, isYou }: { admin: AdminAccount; isYou: boolean }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startChange] = useTransition();
  const shown = useDisplayName();

  function changeActive(active: boolean) {
    startChange(async () => {
      const result = await setAdminActive(admin.id, active);
      setError(result.error ?? null);
      setMode("idle");
    });
  }

  return (
    <Card className={admin.active ? "" : "opacity-60"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">{shown(admin.name)}</p>
          <p className="truncate text-sm text-slate-500">
            {signInLabel(admin)}
            {!admin.active && " · Deactivated"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {isYou && <Badge>You</Badge>}
          {!admin.active && <Badge tone="slate">Deactivated</Badge>}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {mode === "login" && <LoginForm admin={admin} onDone={() => setMode("idle")} />}

      {mode === "deactivate" && (
        <div className="mt-3">
          <ConfirmCard
            title={`Deactivate ${shown(admin.name)}?`}
            description="They won't be able to sign in. Their account is kept, and you can turn it back on."
            confirmLabel={pending ? "Deactivating…" : "Deactivate"}
            onBack={() => setMode("idle")}
            onConfirm={() => changeActive(false)}
          />
        </div>
      )}

      {mode === "idle" && (
        <div className={`mt-3 grid gap-2 ${isYou ? "grid-cols-1" : "grid-cols-2"}`}>
          <Button variant="secondary" onClick={() => setMode("login")}>
            {admin.hasLogin ? "Reset password" : "Set up login"}
          </Button>
          {!isYou &&
            (admin.active ? (
              <Button variant="danger" onClick={() => setMode("deactivate")}>
                Deactivate
              </Button>
            ) : (
              <Button variant="secondary" disabled={pending} onClick={() => changeActive(true)}>
                {pending ? "Saving…" : "Reactivate"}
              </Button>
            ))}
        </div>
      )}
    </Card>
  );
}

function signInLabel(admin: AdminAccount): string {
  if (!admin.hasLogin) return "No login yet";
  if (admin.username && admin.mobile) return `Signs in with ${admin.username} or ${admin.mobile}`;
  if (admin.username) return `Signs in with ${admin.username}`;
  if (admin.mobile) return `Signs in with ${admin.mobile}`;
  return "Has a login";
}

function LoginForm({ admin, onDone }: { admin: AdminAccount; onDone: () => void }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(setLogin.bind(null, admin.id), {});
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const stored = admin.mobile ? splitMobile(admin.mobile) : { iso: DEFAULT_COUNTRY_ISO, national: "" };

  if (state.saved) {
    return (
      <div className="mt-3">
        <LoginReady {...state.saved} onDone={onDone} />
      </div>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <MobileFields
        required={!admin.username}
        country={state.values?.country ?? stored.iso}
        mobile={state.values?.mobile ?? stored.national}
        hint={
          admin.username
            ? "Optional. They can also sign in with this number."
            : "Without the country code."
        }
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
