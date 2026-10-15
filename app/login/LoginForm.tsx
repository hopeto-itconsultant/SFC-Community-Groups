"use client";

import { useActionState, useState } from "react";
import { Field, inputClass } from "@/components/form";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { type SignInState, signIn } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <h2 className="text-lg font-bold">Sign in</h2>

      <Field label="Username or mobile number" required>
        <input
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          defaultValue={state.identifier}
          placeholder="Username or mobile number"
          className={inputClass}
        />
      </Field>

      <Field label="Password" required>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
          </button>
        </div>
      </Field>

      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold text-slate-700">
        <input name="remember" type="checkbox" defaultChecked className="size-5 shrink-0 accent-brand-700" />
        Remember me
      </label>

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
