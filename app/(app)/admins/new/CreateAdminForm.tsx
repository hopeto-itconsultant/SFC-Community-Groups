"use client";

import { useActionState, useState } from "react";
import { Field, inputClass } from "@/components/form";
import { MobileFields } from "@/components/MobileFields";
import { PasswordStrengthMeter } from "@/components/PasswordStrength";
import { Button, Card } from "@/components/ui";
import { createAdmin, type CreateAdminState } from "@/lib/actions/people";
import { DEFAULT_PASSWORD, passwordProblem } from "@/lib/passwords";
import { LoginReady } from "../LoginReady";

export function CreateAdminForm() {
  const [state, action, pending] = useActionState<CreateAdminState, FormData>(createAdmin, {});
  const [password, setPassword] = useState(DEFAULT_PASSWORD);

  if (state.saved) {
    return (
      <div className="px-4 pt-4">
        <LoginReady {...state.saved} />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 px-4 pt-4">
      <Card>
        <div className="space-y-4">
          <Field label="Username" required hint="3–32 characters. They type this to sign in.">
            <input
              name="username"
              type="text"
              required
              defaultValue={state.values?.username}
              placeholder="e.g. david"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
          <Field label="Name" hint="Optional. Leave blank to show the username.">
            <input
              name="name"
              type="text"
              defaultValue={state.values?.name}
              placeholder="e.g. Bro. David"
              autoComplete="off"
              autoCapitalize="words"
              className={inputClass}
            />
          </Field>
          <MobileFields
            country={state.values?.country}
            mobile={state.values?.mobile}
            hint="Optional. Without the country code. They can also sign in with this number."
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
        </div>
      </Card>
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        {state.error && (
          <p role="alert" className="mb-2 text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" block disabled={pending || passwordProblem(password) !== null}>
          {pending ? "SAVING…" : "ADD ADMIN"}
        </Button>
      </div>
    </form>
  );
}
