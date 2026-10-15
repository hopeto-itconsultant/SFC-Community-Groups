import type { CookieOptions } from "@supabase/ssr";

/** Preference cookie. Missing or "1" keeps the long-lived login; "0" ends it when the browser closes. */
export const REMEMBER_COOKIE = "sfc-remember";

/** Same lifetime @supabase/ssr gives auth cookies when the login is remembered. */
export const REMEMBER_MAX_AGE = 400 * 24 * 60 * 60;

type RememberCookie = {
  name: string;
  value: string;
  options: {
    path: string;
    sameSite: "lax";
    httpOnly: true;
    maxAge?: number;
  };
};

/** No cookie, or any value other than "0", keeps today's persistent session. */
export function remembersSession(value: string | undefined): boolean {
  return value !== "0";
}

export function rememberCookie(remember: boolean): RememberCookie {
  return {
    name: REMEMBER_COOKIE,
    value: remember ? "1" : "0",
    options: {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
    },
  };
}

export function clearedRememberCookie(): RememberCookie {
  return {
    name: REMEMBER_COOKIE,
    value: "",
    options: {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 0,
    },
  };
}

/**
 * @supabase/ssr always writes auth cookies with a 400-day maxAge, so a session
 * login has to drop that lifetime after the library builds the cookie.
 * Deletions (maxAge 0) stay deletions.
 */
export function applyRememberMe<T extends { options: CookieOptions }>(cookiesToSet: T[], remember: boolean): T[] {
  if (remember) return cookiesToSet;
  return cookiesToSet.map((cookie) => {
    if (cookie.options.maxAge === 0) return cookie;
    const { maxAge: _maxAge, expires: _expires, ...options } = cookie.options;
    return { ...cookie, options };
  });
}
