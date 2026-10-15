"use client";

import { useActionState, useRef, useState } from "react";
import { Field, inputClass } from "@/components/form";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { PasswordStrengthMeter } from "@/components/PasswordStrength";
import { Button, Card } from "@/components/ui";
import { type ChangePasswordState, changePassword } from "@/lib/actions/auth";
import { passwordProblem } from "@/lib/passwords";

function PasswordInput({
  name,
  autoComplete,
  value,
  onChange,
}: {
  name: string;
  autoComplete: "current-password" | "new-password";
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        required
        {...(onChange ? { value, onChange: (event) => onChange(event.target.value) } : {})}
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
  );
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(async (prev, formData) => {
    const result = await changePassword(prev, formData);
    if (result.saved) {
      formRef.current?.reset();
      setNewPassword("");
    }
    return result;
  }, {});

  return (
    <form ref={formRef} action={action} className="space-y-4 p-4">
      <Card className="space-y-4">
        <Field label="Current password" required>
          <PasswordInput name="currentPassword" autoComplete="current-password" />
        </Field>
        <Field label="New password" required>
          <PasswordInput
            name="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
          />
          <PasswordStrengthMeter password={newPassword} />
        </Field>
        <Field label="Confirm new password" required>
          <PasswordInput name="confirmPassword" autoComplete="new-password" />
        </Field>
      </Card>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          Password changed
        </p>
      )}

      <Button type="submit" size="lg" block disabled={pending || passwordProblem(newPassword) !== null}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
