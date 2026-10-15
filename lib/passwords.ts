export const MIN_PASSWORD_LENGTH = 6;

/** Length at which a password that already meets the rules counts as strong. */
const STRONG_PASSWORD_LENGTH = 10;

/** Shared starting password for new logins and resets. Still editable in the form. */
export const DEFAULT_PASSWORD = "CGPass@1026";

export type PasswordStrength = "weak" | "good" | "strong";

/** Returns an error message, or null if the password is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/\d/.test(password)) return "Add a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add a special character.";
  return null;
}

/** Shown under every new-password field, whether or not anyone has typed. */
export const PASSWORD_RULE = `At least ${MIN_PASSWORD_LENGTH} characters, a number, and a special character`;

/** How strong a typed password looks. Null when the field is still empty. */
export function passwordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  if (passwordProblem(password)) return "weak";
  const mixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  if (password.length >= STRONG_PASSWORD_LENGTH && mixedCase) return "strong";
  return "good";
}
