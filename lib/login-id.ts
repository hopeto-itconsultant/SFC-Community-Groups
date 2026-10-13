// Logins use Supabase email + password under the hood: each mobile number maps
// to an internal address that people never see, so no SMS provider is needed.
// ".invalid" is a reserved domain, so nothing can ever be emailed to it.
const LOGIN_EMAIL_DOMAIN = "login.sfc.invalid";

/** Assumed for 10-digit numbers typed without a country code. */
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
