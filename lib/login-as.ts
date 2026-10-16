import "server-only";

import { cookies } from "next/headers";
import { REMEMBER_MAX_AGE } from "@/lib/supabase/remember";

/** httpOnly cookie naming the profile an Admin is viewing as. */
export const LOGIN_AS_COOKIE = "sfc-login-as";

type LoginAsCookie = {
  name: string;
  value: string;
  options: {
    path: string;
    sameSite: "lax";
    httpOnly: true;
    maxAge?: number;
  };
};

export function loginAsCookie(profileId: string): LoginAsCookie {
  return {
    name: LOGIN_AS_COOKIE,
    value: profileId,
    options: {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: REMEMBER_MAX_AGE,
    },
  };
}

export function clearedLoginAsCookie(): LoginAsCookie {
  return {
    name: LOGIN_AS_COOKIE,
    value: "",
    options: {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 0,
    },
  };
}

/** Profile id the Admin is viewing as, or null. */
export async function getLoginAsProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOGIN_AS_COOKIE)?.value?.trim() ?? "";
  return value || null;
}

export async function setLoginAsProfileId(profileId: string): Promise<void> {
  const cookieStore = await cookies();
  const cookie = loginAsCookie(profileId);
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}

export async function clearLoginAsProfileId(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = clearedLoginAsCookie();
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}
