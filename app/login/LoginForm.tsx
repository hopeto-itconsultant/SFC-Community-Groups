"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/form";
import { Button } from "@/components/ui";
import { type SignInState, signIn } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-5">
      <h2 className="text-lg font-bold">Sign in</h2>

      <Field label="Mobile number">
        <input
          name="mobile"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          required
          defaultValue={state.mobile}
          placeholder="e.g. 9876543210"
          className={inputClass}
        />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
