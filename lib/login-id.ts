// Logins use Supabase email + password under the hood: each mobile number maps
// to an internal address that people never see, so no SMS provider is needed.
// ".invalid" is a reserved domain, so nothing can ever be emailed to it.
const LOGIN_EMAIL_DOMAIN = "login.sfc.invalid";

/** E.164 mobile numbers, e.g. +919876543210. */
export const MOBILE_PATTERN = /^\+[1-9][0-9]{6,14}$/;

/** Removes spaces and dashes people type into phone numbers. */
export function normalizeMobile(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/** "+919876543210" -> "919876543210@login.sfc.invalid" */
export function loginEmailForMobile(mobile: string): string {
  return `${mobile.replace(/^\+/, "")}@${LOGIN_EMAIL_DOMAIN}`;
}
