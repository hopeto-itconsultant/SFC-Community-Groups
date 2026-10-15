// Logins use Supabase email + password under the hood. A mobile number, or an
// admin username, maps to an internal address that people never see, so no SMS
// provider is needed. ".invalid" is a reserved domain, so nothing can ever be
// emailed to it.
const LOGIN_EMAIL_DOMAIN = "login.sfc.invalid";

/** Lowercase, 3–32 characters, starts with a letter. Dots and underscores are allowed. */
export const USERNAME_PATTERN = /^[a-z][a-z0-9._]{2,31}$/;

export const USERNAME_RULE =
  "Usernames are 3–32 characters, start with a letter, and use only letters, numbers, dots, and underscores.";

/** Assumed for 10-digit numbers typed without a country code (sign-in and create-admin). */
const DEFAULT_COUNTRY_CODE = "91";

/** Stored format (E.164), e.g. +919876543210. */
export const MOBILE_PATTERN = /^\+[1-9][0-9]{6,14}$/;

/**
 * Turns what people type into the stored format. The "+" is optional, and a
 * 10-digit number is taken as Indian: "98765 43210", "919876543210" and
 * "+91 98765-43210" all become "+919876543210". Returns null if it can't be a
 * mobile number.
 */
export function normalizeMobile(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  if (!/^[0-9]+$/.test(digits)) return null;
  const mobile = `+${digits.length === 10 ? DEFAULT_COUNTRY_CODE + digits : digits}`;
  return MOBILE_PATTERN.test(mobile) ? mobile : null;
}

/** "+919876543210" -> "919876543210@login.sfc.invalid" */
export function loginEmailForMobile(mobile: string): string {
  return `${mobile.replace(/^\+/, "")}@${LOGIN_EMAIL_DOMAIN}`;
}

/** "David" -> "david". Returns null when it cannot be a username. */
export function normalizeUsername(input: string): string | null {
  const username = input.trim().toLowerCase();
  return USERNAME_PATTERN.test(username) ? username : null;
}

/** "david" -> "u.david@login.sfc.invalid". The prefix keeps it distinct from a mobile address. */
export function loginEmailForUsername(username: string): string {
  return `u.${username}@${LOGIN_EMAIL_DOMAIN}`;
}

/** Username logins use the prefixed address. Everyone else still uses the mobile address. */
export function loginEmailForProfile(profile: { username: string | null; mobile: string | null }): string | null {
  if (profile.username) return loginEmailForUsername(profile.username);
  if (profile.mobile) return loginEmailForMobile(profile.mobile);
  return null;
}

/** True when the sign-in text is only a phone number, not a username. */
export function looksLikeMobile(input: string): boolean {
  return /^\+?[0-9]+$/.test(input.replace(/[\s\-()]/g, ""));
}
