import { type PasswordStrength, PASSWORD_RULE, passwordStrength } from "@/lib/passwords";

const STEPS: Record<PasswordStrength, number> = { weak: 1, good: 2, strong: 3 };
const WIDTH: Record<PasswordStrength, string> = { weak: "w-1/3", good: "w-2/3", strong: "w-full" };
const BAR: Record<PasswordStrength, string> = {
  weak: "bg-red-500",
  good: "bg-amber-500",
  strong: "bg-emerald-600",
};
const TEXT: Record<PasswordStrength, string> = {
  weak: "text-red-600",
  good: "text-amber-700",
  strong: "text-emerald-700",
};
const LABEL: Record<PasswordStrength, string> = { weak: "Weak", good: "Good", strong: "Strong" };

/** Thin bar under a new-password field. The rules stay on screen; the bar fills as they type. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const level = passwordStrength(password);

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex h-4 items-center gap-2">
        <div
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={level ? STEPS[level] : 0}
          aria-valuetext={level ? LABEL[level] : PASSWORD_RULE}
        >
          {level && <div className={`h-full ${WIDTH[level]} ${BAR[level]}`} />}
        </div>
        <span className={`w-12 shrink-0 text-right text-xs font-semibold leading-4 ${level ? TEXT[level] : ""}`}>
          {level ? LABEL[level] : ""}
        </span>
      </div>
      <p className="text-xs font-medium leading-snug text-slate-500">{PASSWORD_RULE}</p>
    </div>
  );
}
